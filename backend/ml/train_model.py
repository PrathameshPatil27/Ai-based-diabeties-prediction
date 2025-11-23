"""
Train Random Forest model on Pima Indians Diabetes Dataset
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

def load_pima_dataset():
    """
    Load the Pima Indians Diabetes Dataset
    Dataset columns: Pregnancies, Glucose, BloodPressure, SkinThickness, 
                     Insulin, BMI, DiabetesPedigreeFunction, Age, Outcome
    """
    # Pima dataset URL - using a standard dataset
    url = "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv"
    
    column_names = [
        'Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness',
        'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age', 'Outcome'
    ]
    
    try:
        # Try to load from URL
        df = pd.read_csv(url, names=column_names)
        print(f"Dataset loaded from URL. Shape: {df.shape}")
    except Exception as e:
        print(f"Could not load from URL: {e}")
        # If URL fails, create a synthetic dataset based on Pima characteristics
        print("Creating synthetic dataset based on Pima dataset characteristics...")
        np.random.seed(42)
        n_samples = 768
        
        df = pd.DataFrame({
            'Pregnancies': np.random.randint(0, 18, n_samples),
            'Glucose': np.random.normal(120, 32, n_samples).clip(0, 200),
            'BloodPressure': np.random.normal(69, 19, n_samples).clip(0, 122),
            'SkinThickness': np.random.normal(20, 16, n_samples).clip(0, 99),
            'Insulin': np.random.normal(79, 115, n_samples).clip(0, 846),
            'BMI': np.random.normal(32, 7, n_samples).clip(0, 67),
            'DiabetesPedigreeFunction': np.random.normal(0.47, 0.33, n_samples).clip(0, 2.42),
            'Age': np.random.normal(33, 12, n_samples).clip(21, 81),
        })
        
        # Create outcome based on some logical rules
        df['Outcome'] = (
            (df['Glucose'] > 125).astype(int) * 0.4 +
            (df['BMI'] > 30).astype(int) * 0.2 +
            (df['Age'] > 45).astype(int) * 0.2 +
            (df['BloodPressure'] > 85).astype(int) * 0.1 +
            np.random.rand(n_samples) * 0.1
        ) > 0.5
        
        df['Outcome'] = df['Outcome'].astype(int)
        print(f"Synthetic dataset created. Shape: {df.shape}")
    
    # Handle missing values (0s in Pima dataset often represent missing values)
    # Replace 0s in certain columns with NaN
    zero_cols = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    df[zero_cols] = df[zero_cols].replace(0, np.nan)
    
    # Fill missing values with median
    df[zero_cols] = df[zero_cols].fillna(df[zero_cols].median())
    
    return df

def train_random_forest():
    """Train Random Forest classifier"""
    print("Loading dataset...")
    df = load_pima_dataset()
    
    # Prepare features and target
    X = df.drop('Outcome', axis=1)
    y = df['Outcome']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set size: {X_train.shape}")
    print(f"Test set size: {X_test.shape}")
    
    # Train Random Forest
    print("Training Random Forest model...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    rf_model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = rf_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nModel Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, 'diabetes_rf_model.pkl')
    
    joblib.dump(rf_model, model_path)
    print(f"\nModel saved to: {model_path}")
    
    # Save feature names for reference
    feature_names_path = os.path.join(model_dir, 'feature_names.txt')
    with open(feature_names_path, 'w') as f:
        f.write(','.join(X.columns.tolist()))
    
    # Save median values for handling missing values in predictions
    import json
    median_values = {}
    zero_cols = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    for col in zero_cols:
        if col in df.columns:
            median_values[col] = float(df[col].median())
    
    median_file = os.path.join(model_dir, 'median_values.json')
    with open(median_file, 'w') as f:
        json.dump(median_values, f, indent=2)
    print(f"Median values saved to: {median_file}")
    
    print("Training completed successfully!")
    return rf_model

if __name__ == '__main__':
    train_random_forest()

