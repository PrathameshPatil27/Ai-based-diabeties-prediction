"""
Prediction service using trained Random Forest model
Can be called from Node.js backend
"""
import sys
import json
import os
import joblib
import numpy as np
import pandas as pd

def load_model():
    """Load the trained Random Forest model"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'diabetes_rf_model.pkl')
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}. Please train the model first.")
    
    model = joblib.load(model_path)
    return model

def predict_diabetes(input_data):
    """
    Make prediction using Random Forest model
    
    Args:
        input_data: Dictionary with features:
            - pregnancies (default: 0 if not provided or gender is male)
            - glucose
            - bloodPressure
            - skinThickness
            - insulin
            - bmi
            - diabetesPedigreeFunction
            - age
    
    Returns:
        Dictionary with prediction results
    """
    try:
        model = load_model()
        
        # Feature order expected by the model
        feature_order = [
            'Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness',
            'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age'
        ]
        
        # Prepare input features as DataFrame with proper column names
        features_dict = {
            'Pregnancies': float(input_data.get('pregnancies', 0)),
            'Glucose': float(input_data.get('glucose', 0)),
            'BloodPressure': float(input_data.get('bloodPressure', 0)),
            'SkinThickness': float(input_data.get('skinThickness', 0)),
            'Insulin': float(input_data.get('insulin', 0)),
            'BMI': float(input_data.get('bmi', 0)),
            'DiabetesPedigreeFunction': float(input_data.get('diabetesPedigreeFunction', 0)),
            'Age': float(input_data.get('age', 0))
        }
        
        # Create DataFrame with proper column names
        df_features = pd.DataFrame([features_dict])
        zero_cols = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
        
        # Load median values if available, otherwise use defaults
        script_dir = os.path.dirname(os.path.abspath(__file__))
        median_file = os.path.join(script_dir, 'median_values.json')
        
        if os.path.exists(median_file):
            with open(median_file, 'r') as f:
                median_values = json.load(f)
        else:
            # Default median values from Pima dataset
            median_values = {
                'Glucose': 117.0,
                'BloodPressure': 72.0,
                'SkinThickness': 23.0,
                'Insulin': 30.5,
                'BMI': 32.0
            }
        
        # Replace 0s with median values
        for col in zero_cols:
            if col in df_features.columns:
                df_features[col] = df_features[col].replace(0, median_values.get(col, df_features[col].median()))
        
        # Make prediction using DataFrame directly (with proper feature names)
        prediction = model.predict(df_features)[0]
        probabilities = model.predict_proba(df_features)[0]
        
        # Get probability of positive class (diabetes)
        diabetes_probability = float(probabilities[1])
        
        result = {
            'hasDiabetes': bool(prediction == 1),
            'probability': diabetes_probability,
            'modelVersion': 'random-forest-v1'
        }
        
        return result
        
    except Exception as e:
        return {
            'error': str(e),
            'hasDiabetes': False,
            'probability': 0.0
        }

def main():
    """Main function to handle command-line input"""
    try:
        # Read input from command line argument (file path) or stdin
        if len(sys.argv) > 1:
            # Read from file
            file_path = sys.argv[1]
            with open(file_path, 'r') as f:
                input_data = json.load(f)
        else:
            # Read from stdin (JSON format)
            input_str = sys.stdin.read()
            input_data = json.loads(input_str)
        
        # Make prediction
        result = predict_diabetes(input_data)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        error_result = {
            'error': f'Invalid JSON input: {str(e)}',
            'hasDiabetes': False,
            'probability': 0.0
        }
        print(json.dumps(error_result))
        sys.exit(1)
    except Exception as e:
        error_result = {
            'error': str(e),
            'hasDiabetes': False,
            'probability': 0.0
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()

