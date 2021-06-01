
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

    makeNode(name) {
        return new Node(name);
    }

    makeEdge(start, end) {
        return new Egge(start, end);
    }

    addNode(name) {
        const node = this.makeNode(name);
        this.nodes.set(name, node);
    }

    addEdge(start, end) {
        start = this.nodes.get(start);
        end = this.nodes.get(end);

        const edge = this.makeEdge(start, end);
        start.connectedNodes.add(end);
        start.connectedEdges.set(end, edge);
        end.connectedNodes.add(start);
        end.connectedEdges.set(start, edge);

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

class Svg{
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    }

    addLine(x1, y1, x2, y2) {
        return this.svg.append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .style("stroke", "darkgray")
            .style("stroke-width", 4);
    }

    addCircle(x, y, r) {
        var i = Math.floor(Math.random() * 10);
        const color =  d3.schemeCategory10[i];
        return this.svg.append('circle')
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", r)
            .attr("fill", color);
    }

}

function getDarkColor(color) {
    var color = d3.color(color);
    color.r /= 1.3; color.g /= 1.3; color.b /= 1.3;
    return color.formatHex()
}

class SvgEdge extends Edge{
    constructor(svg, start, end) {
        super(start, end);
        this.svg = svg;
        this.line = svg.addLine(start.x, start.y, end.x, end.y);
    }

    updatePosition() {
        this.line = this.line
            .attr("x1", this.start.x)
            .attr("y1", this.start.y)
            .attr("x2", this.end.x)
            .attr("y2", this.end.y);
    }

}

class SvgNode extends Node {
    constructor(svg, name, x, y) {
        super(name);
        this.x = x;
        this.y = y;
        this.svg = svg;

        const drag = d3.drag()
            .on("start", this.dragStarted)
            .on("drag", this.dragged)
            .on("end", this.dragEnded);

        this.circle = svg.addCircle(x, y, 20)
            .data([this])
            .call(drag);
    }

    updatePosition(x, y) {
        this.x = x;
        this.y = y;
        this.circle = this.circle
            .attr("cx", x)
            .attr("cy", y);
        
        for (let [_, edge] of this.connectedEdges) {
            edge.updatePosition();
        }
    }

    dragStarted(event, d) {
        var newColor = getDarkColor(d3.select(this).attr("fill"));
        d3.select(this)
            .style("stroke", newColor)
            .style("stroke-width", 4);
    }
    
    dragged(event, d) {
        d.updatePosition(event.x, event.y);
    }
    
    dragEnded(event, d) {
        d3.select(this)
            .style("stroke", null)
            .style("stroke-width", null);
    }
}

class SvgGraph extends Graph {
    constructor(svg) {
        super();
        this.svg = svg;
    }

    makeNode(name) {
        const x = Math.random() * this.svg.width,
              y = Math.random() * this.svg.height;
        return new SvgNode(this.svg, name, x, y);
    }

    makeEdge(start, end) {
        return new SvgEdge(this.svg, start, end);
    }
}

function testGraph(){
    const svg = new Svg(500, 500);
    const graph = new SvgGraph(svg);
    graph.addNode("A");
    graph.addNode("B");
    graph.addNode("C");
    graph.addNode("D");
    graph.addNode("E");
    graph.addEdge("A", "B");
    graph.addEdge("B", "C");
    graph.addEdge("C", "A");
    graph.addEdge("C", "D");
    graph.addEdge("D", "E");
}


testGraph();
