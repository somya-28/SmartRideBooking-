from flask import Flask, jsonify
from flask_cors import CORS
from routes.route import route_bp
from routes.match import match_bp
from routes.auth import auth_bp
from routes.otp import otp_bp
from routes.rides import rides_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register blueprints
app.register_blueprint(route_bp, url_prefix='/api/route')
app.register_blueprint(match_bp, url_prefix='/api/match')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(otp_bp, url_prefix='/api/otp')
app.register_blueprint(rides_bp, url_prefix='/api/rides')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Server is running'})

if __name__ == '__main__':
    app.run(debug=True)
