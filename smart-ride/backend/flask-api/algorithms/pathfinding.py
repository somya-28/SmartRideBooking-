"""
Pathfinding Algorithm Module

This module provides implementations of Dijkstra's algorithm and A* 
for finding optimal paths in a city graph.

Time Complexity Analysis:
- Dijkstra's Algorithm: O((V + E) log V), where V is the number of vertices and E is the number of edges
  * Using a priority queue (binary heap): O(E log V)
  * While loop iterations: O(V)
  * Total: O((V + E) log V)

- A* Algorithm: O((V + E) log V) in the worst case, but typically faster than Dijkstra in practice
  due to the heuristic guiding the search toward the goal

Space Complexity:
- Both algorithms: O(V) for storing distances, visited nodes, and the priority queue

The A* algorithm is more efficient for point-to-point pathfinding as it uses
a heuristic to guide the search toward the destination.
"""

import heapq
from typing import Dict, List, Tuple, Set, Optional
import math

from .city_graph import CityGraph, CityNode, haversine_distance


def dijkstra_algorithm(graph: CityGraph, start_id: str, goal_id: str, 
                      cost_type: str = 'time') -> Tuple[Dict[str, float], Dict[str, str]]:
    """
    Dijkstra's algorithm for finding the shortest path in a graph.
    
    Args:
        graph: The city graph
        start_id: ID of the starting node
        goal_id: ID of the goal node
        cost_type: 'time' or 'distance' to optimize for
        
    Returns:
        Tuple of (distances, predecessors):
            distances: Dictionary mapping node IDs to the shortest distance from start
            predecessors: Dictionary mapping node IDs to their predecessor in the shortest path
    """
    # Validate cost_type
    if cost_type not in ['time', 'distance']:
        raise ValueError("cost_type must be 'time' or 'distance'")
    
    # Get the cost index (0 for distance, 1 for time)
    cost_index = 0 if cost_type == 'distance' else 1
    
    # Initialize data structures
    distances = {node_id: float('inf') for node_id in graph.get_nodes()}
    distances[start_id] = 0
    predecessors = {node_id: None for node_id in graph.get_nodes()}
    priority_queue = [(0, start_id)]  # (cost, node_id)
    visited = set()
    
    while priority_queue:
        # Get the node with the smallest distance
        current_distance, current_id = heapq.heappop(priority_queue)
        
        # Skip if we've already processed this node
        if current_id in visited:
            continue
        
        # Mark as visited
        visited.add(current_id)
        
        # If we've reached the goal, we can stop
        if current_id == goal_id:
            break
        
        # Get the current node
        current_node = graph.get_node(current_id)
        if not current_node:
            continue
        
        # Explore neighbors
        for neighbor_id, (distance, time) in current_node.neighbors.items():
            cost = distance if cost_type == 'distance' else time
            
            # Calculate new distance
            new_distance = distances[current_id] + cost
            
            # If this path is better, update it
            if new_distance < distances[neighbor_id]:
                distances[neighbor_id] = new_distance
                predecessors[neighbor_id] = current_id
                heapq.heappush(priority_queue, (new_distance, neighbor_id))
    
    return distances, predecessors


def a_star_algorithm(graph: CityGraph, start_id: str, goal_id: str, 
                    cost_type: str = 'time') -> Tuple[Dict[str, float], Dict[str, str]]:
    """
    A* algorithm for finding the shortest path in a graph.
    
    Args:
        graph: The city graph
        start_id: ID of the starting node
        goal_id: ID of the goal node
        cost_type: 'time' or 'distance' to optimize for
        
    Returns:
        Tuple of (g_scores, predecessors):
            g_scores: Dictionary mapping node IDs to the cost from start
            predecessors: Dictionary mapping node IDs to their predecessor in the shortest path
    """
    # Validate cost_type
    if cost_type not in ['time', 'distance']:
        raise ValueError("cost_type must be 'time' or 'distance'")
    
    # Get the cost index (0 for distance, 1 for time)
    cost_index = 0 if cost_type == 'distance' else 1
    
    # Get the goal node to calculate heuristics
    goal_node = graph.get_node(goal_id)
    if not goal_node:
        raise ValueError(f"Goal node {goal_id} not found in graph")
    
    # Initialize data structures
    g_scores = {node_id: float('inf') for node_id in graph.get_nodes()}
    g_scores[start_id] = 0
    f_scores = {node_id: float('inf') for node_id in graph.get_nodes()}
    
    # Calculate initial f_score for start node (g_score + heuristic)
    start_node = graph.get_node(start_id)
    if not start_node:
        raise ValueError(f"Start node {start_id} not found in graph")
    
    # Calculate heuristic for the start node
    heuristic = calculate_heuristic(start_node, goal_node, cost_type)
    f_scores[start_id] = heuristic
    
    # Initialize other data structures
    predecessors = {node_id: None for node_id in graph.get_nodes()}
    priority_queue = [(f_scores[start_id], start_id)]  # (f_score, node_id)
    visited = set()
    
    while priority_queue:
        # Get the node with the smallest f_score
        _, current_id = heapq.heappop(priority_queue)
        
        # Skip if we've already processed this node
        if current_id in visited:
            continue
        
        # Mark as visited
        visited.add(current_id)
        
        # If we've reached the goal, we can stop
        if current_id == goal_id:
            break
        
        # Get the current node
        current_node = graph.get_node(current_id)
        if not current_node:
            continue
        
        # Explore neighbors
        for neighbor_id, (distance, time) in current_node.neighbors.items():
            cost = distance if cost_type == 'distance' else time
            
            # Calculate tentative g_score
            tentative_g_score = g_scores[current_id] + cost
            
            # If this path is better, update it
            if tentative_g_score < g_scores[neighbor_id]:
                # Update path
                predecessors[neighbor_id] = current_id
                g_scores[neighbor_id] = tentative_g_score
                
                # Calculate f_score (g_score + heuristic)
                neighbor_node = graph.get_node(neighbor_id)
                heuristic = calculate_heuristic(neighbor_node, goal_node, cost_type)
                f_scores[neighbor_id] = tentative_g_score + heuristic
                
                # Add to queue
                heapq.heappush(priority_queue, (f_scores[neighbor_id], neighbor_id))
    
    return g_scores, predecessors


def calculate_heuristic(node: CityNode, goal_node: CityNode, cost_type: str) -> float:
    """
    Calculate the heuristic value for A* algorithm.
    
    Args:
        node: Current node
        goal_node: Goal node
        cost_type: 'time' or 'distance'
        
    Returns:
        Heuristic value
    """
    # Calculate the direct distance between nodes
    distance = haversine_distance(node.lat, node.lng, goal_node.lat, goal_node.lng)
    
    if cost_type == 'distance':
        return distance
    else:  # cost_type == 'time'
        # Estimate time based on distance, assuming an average speed of 30 km/h
        # This converts distance in km to time in minutes
        return distance * 2  # 2 minutes per km (30 km/h)


def reconstruct_path(predecessors: Dict[str, str], start_id: str, goal_id: str) -> List[str]:
    """
    Reconstruct the path from start to goal using the predecessors dictionary.
    
    Args:
        predecessors: Dictionary mapping node IDs to their predecessor
        start_id: ID of the starting node
        goal_id: ID of the goal node
        
    Returns:
        List of node IDs representing the path from start to goal
    """
    path = []
    current_id = goal_id
    
    # If there's no path to the goal
    if predecessors[goal_id] is None and start_id != goal_id:
        return []
    
    # Reconstruct the path by following predecessors from goal to start
    while current_id != start_id:
        path.append(current_id)
        current_id = predecessors[current_id]
    
    # Add the start node
    path.append(start_id)
    
    # Reverse to get path from start to goal
    path.reverse()
    
    return path


def get_path_details(graph: CityGraph, path: List[str]) -> Dict:
    """
    Get detailed information about a path.
    
    Args:
        graph: The city graph
        path: List of node IDs representing the path
        
    Returns:
        Dictionary with path details:
            nodes: List of nodes (with coordinates)
            total_distance: Total distance in kilometers
            total_time: Total time in minutes
            segments: List of path segments with distance and time
    """
    if not path or len(path) < 2:
        return {
            "nodes": [],
            "total_distance": 0,
            "total_time": 0,
            "segments": []
        }
    
    nodes = []
    total_distance = 0
    total_time = 0
    segments = []
    
    # Process each node in the path
    for i in range(len(path) - 1):
        current_id = path[i]
        next_id = path[i + 1]
        
        current_node = graph.get_node(current_id)
        next_node = graph.get_node(next_id)
        
        if not current_node or not next_node:
            continue
        
        # Add current node to the list
        nodes.append({
            "id": current_node.id,
            "lat": current_node.lat,
            "lng": current_node.lng,
            "name": current_node.name
        })
        
        # Get distance and time for this segment
        distance, time = current_node.get_neighbor_cost(next_id)
        
        # Add to totals
        total_distance += distance
        total_time += time
        
        # Add segment details
        segments.append({
            "from": current_id,
            "to": next_id,
            "distance": distance,
            "time": time
        })
    
    # Add the last node
    last_node = graph.get_node(path[-1])
    if last_node:
        nodes.append({
            "id": last_node.id,
            "lat": last_node.lat,
            "lng": last_node.lng,
            "name": last_node.name
        })
    
    return {
        "nodes": nodes,
        "total_distance": round(total_distance, 2),
        "total_time": round(total_time, 2),
        "segments": segments
    }


def find_optimal_path(graph: CityGraph, start_id: str, goal_id: str, algorithm: str = 'a_star', 
                    cost_type: str = 'time') -> Dict:
    """
    Find the optimal path from start to goal using the specified algorithm.
    
    Args:
        graph: The city graph
        start_id: ID of the starting node
        goal_id: ID of the goal node
        algorithm: 'dijkstra' or 'a_star'
        cost_type: 'time' or 'distance' to optimize for
        
    Returns:
        Dictionary with path details
    """
    # Validate inputs
    if algorithm not in ['dijkstra', 'a_star']:
        raise ValueError("algorithm must be 'dijkstra' or 'a_star'")
    
    if cost_type not in ['time', 'distance']:
        raise ValueError("cost_type must be 'time' or 'distance'")
    
    # Run the specified algorithm
    if algorithm == 'dijkstra':
        scores, predecessors = dijkstra_algorithm(graph, start_id, goal_id, cost_type)
    else:  # algorithm == 'a_star'
        scores, predecessors = a_star_algorithm(graph, start_id, goal_id, cost_type)
    
    # Reconstruct the path
    path = reconstruct_path(predecessors, start_id, goal_id)
    
    # Get path details
    path_details = get_path_details(graph, path)
    path_details["algorithm"] = algorithm
    path_details["cost_type"] = cost_type
    
    return path_details


if __name__ == "__main__":
    import os
    from .city_graph import CityGraph
    
    # Load the graph
    graph_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'city_graph.json')
    city_graph = CityGraph.load_from_file(graph_file)
    
    # Test Dijkstra's algorithm
    print("Testing Dijkstra's algorithm...")
    path_details = find_optimal_path(city_graph, "1", "7", algorithm='dijkstra', cost_type='time')
    print(f"Path: {[node['name'] for node in path_details['nodes']]}")
    print(f"Total distance: {path_details['total_distance']} km")
    print(f"Total time: {path_details['total_time']} minutes")
    
    # Test A* algorithm
    print("\nTesting A* algorithm...")
    path_details = find_optimal_path(city_graph, "1", "7", algorithm='a_star', cost_type='time')
    print(f"Path: {[node['name'] for node in path_details['nodes']]}")
    print(f"Total distance: {path_details['total_distance']} km")
    print(f"Total time: {path_details['total_time']} minutes")
