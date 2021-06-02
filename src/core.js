function dist2d (ri, rj) {
    return ((ri[0]-rj[0])**2+(ri[1]-rj[1])**2)**0.5;
}

function E_lj (ri, rj, r0, e) {
    var r = dist2d(ri, rj);
    return e*((r0/r)**12-(r0/r)**6);
}

function F_lj (ri, rj, r0, e) {
    var r = dist2d(ri, rj);
    var rji = [(ri[0]-rj[0])/r, (ri[1]-rj[1])/r];
    var f = 12*e/r0*((r0/r)**13-(r0/r)**7);
    return [rji[0]*f, rji[1]*f];
}

function F_harmonic (ri, rj, r0, e) {
    var r = dist2d(ri, rj);
    var rji = [(ri[0]-rj[0])/r, (ri[1]-rj[1])/r];
    var f = -2*e*(r-r0);
    return [rji[0]*f, rji[1]*f];
}

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

    addDashedLine(x1, y1, x2, y2, color) {
        return this.svg.append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .style("opacity", 0.5)
            .style("stroke", color)
            .style("stroke-width", 8)
            .style("stroke-dasharray", 8); 
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

    dragStarted(event, edge) {
        edge.start.selected = true;
        edge.end.selected = true;        
        var newColor = getDarkColor(d3.select(this).style("stroke"));
        d3.select(this)
            .style("stroke", newColor);
    }
    
    dragged(event, d) {
        d.start.updatePosition(d.start.x+event.dx, d.start.y+event.dy);
        d.end.updatePosition(d.end.x+event.dx, d.end.y+event.dy);        
    }
    
    dragEnded(event, edge) {
        edge.start.selected = false;
        edge.end.selected = false;
        d3.select(this)
            .style("stroke", "darkgray");
    }

    rightClicked(event, edge) {
        event.preventDefault();
        edge.remove();
    }

}

class SvgNode extends Node {
    constructor(svg, graph, name, x, y) {
        super(name);
        this.x = x;
        this.y = y;
        this.svg = svg;
        this.graph = graph;
        this.color = getRandomColor();

        const drag = d3.drag()
            .on("start", this.dragStarted)
            .on("drag", this.dragged)
            .on("end", this.dragEnded);

        this.circle = svg.addCircle(x, y, 20, this.color)
            .data([this])
            .call(drag)
            .on("click", this.clicked)
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

    dragStarted(event, node) {
        node.selected = true;
        var newColor = getDarkColor(d3.select(this).attr("fill"));
        d3.select(this)
            .style("stroke", newColor)
            .style("stroke-width", 4);
    }
    
    dragged(event, d) {
        d.updatePosition(event.x, event.y);
    }
    
    dragEnded(event, node) {
        node.selected = false;
        d3.select(this)
            .style("stroke", null)
            .style("stroke-width", null);
    }

    clicked(event, node) {
        if(event.defaultPrevented) return;
        node.connecting = true;
        console.log("connecting");
    }

    rightClicked(event, node) {
        event.preventDefault();
        node.graph.removeNode(node.name);
    }
}

class SvgGraph extends Graph {
    constructor(svg) {
        super();
        this.svg = svg;
        this.svg.svg = this.svg.svg
            .data([this])
            .on("click", this.clicked)
            .on("contextmenu", this.rightClicked)
            .on("dblclick", this.dblclicked)
            .on("mousemove", this.mousemoved);
    }

    makeNode(name) {
        const x = this.svg.width / 4 + Math.random() * this.svg.width / 2,
              y = this.svg.height / 4 + Math.random() * this.svg.height / 2;
        return new SvgNode(this.svg, this, name, x, y);
    }

    makeEdge(start, end) {
        return new SvgEdge(this.svg, start, end);
    }

    // FIXME
    addAnonymousNode(x, y) { 
        var name = Math.floor(Math.random() * 1000000000);
        const node = new SvgNode(this.svg, this, name, x, y);
        this.nodes.set(name, node);
    }

    // FIXME
    updatePositionLJ(dt) {
        var e = 1.0;
        var radj = 75;
        var rinf = 200;

        //console.log("###")
        for (let [_, nodei] of this.nodes) {
            var f = [0, 0];
            for (let [_, nodej] of this.nodes) {
                if (nodei == nodej) continue;
                if (nodei.selected) continue;
                var r0 = rinf;
                if (nodei.connectedNodes.has(nodej)) {
                    r0 = radj;
                }
                var ri = [nodei.x, nodei.y];
                var rj = [nodej.x, nodej.y];
                var f_tmp = F_harmonic(ri, rj, r0, e);
                f[0] += f_tmp[0];
                f[1] += f_tmp[1];
            }
            //console.log(nodei.name, f);
            nodei.updatePosition(nodei.x+f[0]*dt, nodei.y+f[1]*dt);
        }
    }

    clicked(event, graph) {
        if(event.defaultPrevented) return;

        var connectingNodes = [];
        for(let [_, node] of graph.nodes) {
            if(node.connecting) connectingNodes.push(node);
        }
        if(connectingNodes.length==1 && !graph.connectingEdge){
            var x1 = connectingNodes[0].x,
                y1 = connectingNodes[0].y,
                x2 = event.x,
                y2 = event.y;
            graph.connectingEdge = graph.svg.addDashedLine(x1, y1, x2, y2, getRandomColor());
        }
        if(connectingNodes.length==2){
            graph.addEdge(connectingNodes[0].name, connectingNodes[1].name);
            connectingNodes[0].connecting = false;
            connectingNodes[1].connecting = false;
            graph.connectingEdge.remove();
            graph.connectingEdge = null;
            console.log("connected");
        }
    }
    
    mousemoved(event, graph) {
        if(graph.connectingEdge) {
            graph.connectingEdge = graph.connectingEdge
                .attr("x2", event.x)
                .attr("y2", event.y);
        }
    }

    dblclicked(event, graph) {
        graph.addAnonymousNode(event.x, event.y);
    }

    rightClicked(event, graph) {
        event.preventDefault();
        for(let [_, node] of graph.nodes) {
            node.connecting = false;
        }
        if(graph.connectingEdge) graph.connectingEdge.remove();
        graph.connectingEdge = null;
        console.log("connecting cleared");
    }
}

function testGraph(){
    const svg = new Svg(800, 500);
    const graph = new SvgGraph(svg);
    setInterval(function(){
            graph.updatePositionLJ(0.01);
        }
        , 0.01*1000);
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
