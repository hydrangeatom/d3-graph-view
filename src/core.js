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

    remove() {
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

    remove() {
        for(let [node, edge] of this.connectedEdges) {
            edge.remove();
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
        edge.remove();
        this.edges.delete(edge);
    }
    
    removeNode(name) {
        const node = this.nodes.get(name);
        for(let [_, edge] of node.connectedEdges) {
            this.edges.delete(edge);
        }
        node.remove();
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

    addLine(x1, y1, x2, y2, color) {
        return this.svg.append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .style("stroke", color)
            .style("opacity", 0.5)
            .style("stroke-linecap", "round")
            .style("stroke-width", 8);
    }

    addCircle(x, y, r, color) {
        return this.svg.append('circle')
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", r)
            .attr("fill", color);
    }

}

function getRandomColor() {
    var i = Math.floor(Math.random() * 10);
    const color =  d3.schemeCategory10[i];
    return color;
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
        this.color = getRandomColor();
        const drag = d3.drag()
            .on("start", this.dragStarted)
            .on("drag", this.dragged)
            .on("end", this.dragEnded);
        this.line = svg.addLine(start.x, start.y, end.x, end.y, this.color)
            .data([this])
            .call(drag)
            .on("contextmenu", this.rightClicked);
    }

    remove() {
        super.remove();
        this.line.remove();
    }

    updatePosition() {
        this.line = this.line
            .attr("x1", this.start.x)
            .attr("y1", this.start.y)
            .attr("x2", this.end.x)
            .attr("y2", this.end.y);
    }

    dragStarted(event, d) {
        var newColor = getDarkColor(d3.select(this).style("stroke"));
        d3.select(this)
            .style("stroke", newColor);
    }
    
    dragged(event, d) {
        d.start.updatePosition(d.start.x+event.dx, d.start.y+event.dy);
        d.end.updatePosition(d.end.x+event.dx, d.end.y+event.dy);        
    }
    
    dragEnded(event, d) {
        d3.select(this)
            .style("stroke", "darkgray");
    }

    rightClicked(event, edge) {
        event.preventDefault();
        edge.remove();
    }

}

class SvgNode extends Node {
    constructor(svg, name, x, y) {
        super(name);
        this.x = x;
        this.y = y;
        this.svg = svg;
        this.color = getRandomColor();

        const drag = d3.drag()
            .on("start", this.dragStarted)
            .on("drag", this.dragged)
            .on("end", this.dragEnded);

        this.circle = svg.addCircle(x, y, 20, this.color)
            .data([this])
            .call(drag)
            .on("contextmenu",this.rightClicked);
    }

    remove() {
        super.remove();
        this.circle.remove();
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

    rightClicked(event, node) {
        event.preventDefault();
        node.remove();
    }
}

class SvgGraph extends Graph {
    constructor(svg) {
        super();
        this.svg = svg;
        this.svg.svg = this.svg.svg.on("click", this.clicked);
    }

    makeNode(name) {
        const x = Math.random() * this.svg.width,
              y = Math.random() * this.svg.height;
        return new SvgNode(this.svg, name, x, y);
    }

    makeEdge(start, end) {
        return new SvgEdge(this.svg, start, end);
    }

    clicked(event, d) {
        if(event.defaultPrevented) return;
        console.log("clicked");
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
