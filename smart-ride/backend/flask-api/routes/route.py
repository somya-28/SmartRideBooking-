from flask import Blueprint, request, jsonify
from cpp_bridge import run_cpp_exec

route_bp = Blueprint('route', __name__)

@route_bp.route('/shortest', methods=['POST'])
def shortest_path():
    data = request.get_json()
    result = run_cpp_exec('../cpp-core/graph_exec', data)
    return jsonify(result)
