#include <bits/stdc++.h>
#include <nlohmann/json.hpp> // Add JSON lib
using namespace std;
using json = nlohmann::json;

const int INF = 1e9;
vector<vector<pair<int, int>>> adj;

vector<int> dijkstra(int src, int V) {
    vector<int> dist(V, INF);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;
    dist[src] = 0;
    pq.push({0, src});

    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[v] > d + w) {
                dist[v] = d + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}

int main() {
    string input;
    getline(cin, input);
    json j = json::parse(input);

    int V = j["V"];
    int src = j["source"];
    auto edges = j["edges"];
    adj.assign(V, {});

    for (auto &e : edges)
        adj[e[0]].emplace_back(e[1], e[2]);

    auto result = dijkstra(src, V);

    json out;
    out["distances"] = result;
    cout << out.dump() << endl;

    return 0;
}
