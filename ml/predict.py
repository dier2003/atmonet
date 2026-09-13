# Integration placeholder for your trained ML model.
# Input features can be rainfall, water_level, humidity, temperature.
# Save/export your trained model and replace this function with model.predict_proba().
def predict(rainfall, water_level, humidity, temperature):
    score = min(0.99, max(0.01, rainfall/180*0.45 + water_level/6*0.45 + humidity/100*0.10))
    risk = 'CRITICAL' if score >= .80 else 'HIGH' if score >= .65 else 'MODERATE' if score >= .40 else 'LOW'
    return {'risk': risk, 'probability': round(score*100), 'recommendation': 'Follow official warning procedures.'}
