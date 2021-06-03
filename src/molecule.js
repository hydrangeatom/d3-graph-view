const SVG_WIDTH  = 800,
      SVG_HEIGHT = 500;

const nodes = [
    {id: "C1", class: "carbon"},
    {id: "H1", class: "hydrogen"},
    {id: "H2", class: "hydrogen"},
    {id: "H3", class: "hydrogen"},
    {id: "N1", class: "nitrogen"},
    {id: "O1", class: "oxygen"}
];

const links = [
    {source: "C1", target: "H1"},
    {source: "C1", target: "H2"},
    {source: "C1", target: "N1"},
    {source: "N1", target: "O1"},
    {source: "O1", target: "H3"},
];

nodes.forEach( node => {
    node.x = SVG_WIDTH / 4 + Math.random() * SVG_WIDTH / 2;
    node.y = SVG_HEIGHT / 4 + Math.random() * SVG_HEIGHT / 2;
    node.r = 20;
});

links.forEach( link => {
    link.dist = 40;
});

const svg = d3
    .select("body")
    .append("svg")
    .attr("width", SVG_WIDTH)
    .attr("height", SVG_HEIGHT);

const simulation = d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-600))
    .force("link", d3.forceLink(links)
        .id( d => d.id)
        .distance( d => d.dist));

const lines = svg
    .selectAll("line")
    .data(links)
    .enter()
    .append("line");


const circles = svg
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", d => d.class)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.r)
    .call(d3.drag()
        .on("start",(event, d) => {
            simulation.alpha(1).restart();
            d.fx = d.x;
            d.fy = d.y;
        })
        .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
        })
        .on("end", (event, d) =>  {
            d.fx = null;
            d.fy = null;
            simulation.alphaTarget(0.1);
        }));

simulation.on("tick", () => {
    lines
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
    circles
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
});
