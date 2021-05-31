
var nNodes = 10;

var edgesList = [
    {start: 0, end: 1},
    {start: 0, end: 9},
    {start: 1, end: 2},
    {start: 2, end: 3},
    {start: 3, end: 4},
    {start: 3, end: 5},
    {start: 3, end: 6},
    {start: 3, end: 7},
    {start: 7, end: 8}
];

class Edge {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }

    disconnect() {
        this.start.connectedEdges.delete(this);
        this.start.connectedNodes.delete(this.end);
        this.end.connectedEdges.delete(this);
        this.end.connectedNodes.delete(this.start);
    }
}

class Node {
    constructor(name) {
        this.name = name;
        this.connectedNodes = new Set();
        this.connectedEdges = new Map();
    }

    connect(otherNode) {
        const edge = new Edge(this, otherNode);
        this.connectedNodes.add(otherNode);
        this.connectedEdges.set(otherNode, edge);
        otherNode.connectedNodes.add(this);
        otherNode.connectedEdges.set(this, edge);
        return edge;
    }

    disconnectAll() {
        for(let [node, edge] of this.connectedEdges) {
            edge.disconnect();
        }
    }
}

class Graph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Set();
    }

    addNode(name) {
        const node = new Node(name);
        this.nodes.set(name, node);
    }

    addEdge(start, end) {
        start = this.nodes.get(start);
        end = this.nodes.get(end);
        const edge = start.connect(end);
        this.edges.add(edge);
    }

    removeEdge(start, end) {
        start = this.nodes.get(start);
        end = this.nodes.get(end);
        const edge = start.connectedEdges.get(end);
        edge.disconnect();
        this.edges.delete(edge);
    }
    
    removeNode(name) {
        const node = this.nodes.get(name);
        for(let [_, edge] of node.connectedEdges) {
            this.edges.delete(edge);
        }
        node.disconnectAll();
        this.nodes.delete(name);
    }

    print() {
        console.log("### graph ###");
        for(let [name, _] of this.nodes) {
            console.log( "node: "+name);
        }
        for(let edge of this.edges) {
            const start = edge.start.name;
            const end = edge.end.name;
            console.log(" edge: "+start + " - " + end);
        }
        console.log("");
    }
}

function testGraph(){
    const graph = new Graph();
    graph.addNode("A");
    graph.addNode("B");
    graph.addNode("C");
    graph.addEdge("A", "B");
    graph.print();
    graph.addEdge("B", "C");
    graph.print();
    graph.addEdge("C", "A");
    graph.print();
    graph.removeEdge("A", "B");
    graph.print();
    graph.removeNode("A");
    graph.print();
}

testGraph();

var width   = 500,
    height  = 500,
    radius  = 20;

const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const circles = d3.range(nNodes).map(i => ({
    x: Math.random() * (width - radius * 2) + radius,
    y: Math.random() * (height - radius * 2) + radius,
}));

function updateLine(line) {
    lines = edgesList.map(e => ({
        x1: circles[e.start].x,
        y1: circles[e.start].y,
        x2: circles[e.end].x,
        y2: circles[e.end].y,
    }));

    return line
        .data(lines)
        .join("line")
        .attr("x1", d => d.x1)
        .attr("y1", d => d.y1)
        .attr("x2", d => d.x2)
        .attr("y2", d => d.y2)
        .style("stroke", "darkgray")
        .style("stroke-width", 4);
}

var line = svg.append("g").selectAll("line");
line = updateLine(line);

function getDarkColor(color) {
    var color = d3.color(color);
    color.r /= 1.3; color.g /= 1.3; color.b /= 1.3;
    return color.formatHex()
}

function dragStarted(event, d) {
    var newColor = getDarkColor(d3.select(this).attr("fill"));
    d3.select(this)
        .style("stroke", newColor)
        .style("stroke-width", 4);
}

function dragged(event, d) {
    d3.select(this)
        .attr("cx", d.x = event.x)
        .attr("cy", d.y = event.y);
    line = updateLine(line);
}

function dragEnded(event, d) {
    d3.select(this)
        .style("stroke", null)
        .style("stroke-width", null);
    this.remove();
    line = updateLine(line);
}

drag = d3.drag()
    .on("start", dragStarted)
    .on("drag", dragged)
    .on("end", dragEnded);

var circle = svg.append("g")
    .selectAll("circle")
    .data(circles)
    .join("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", radius)
    .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
    .call(drag);