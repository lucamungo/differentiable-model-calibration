<script setup>
const props = defineProps({
    inputNodes: { type: Number, default: 4 },
    hiddenLayers: { type: Array, default: () => [5, 5] },
    outputNodes: { type: Number, default: 4 },
    nodeRadius: { type: Number, default: 18 },
    layerSpacing: { type: Number, default: 100 },
    nodeSpacing: { type: Number, default: 50 },
    strokeColor: { type: String, default: "#3b82f6" },
    fillColor: { type: String, default: "#dbeafe" },
    lineColor: { type: String, default: "#3b82f6" },
});

// Build layer structure
const layers = [
    props.inputNodes,
    ...props.hiddenLayers,
    props.outputNodes,
];

const maxNodes = Math.max(...layers);
const width = (layers.length - 1) * props.layerSpacing + 120;
const height = (maxNodes - 1) * props.nodeSpacing + 100;

// Calculate node positions
function getNodeY(layerSize, nodeIndex) {
    const layerHeight = (layerSize - 1) * props.nodeSpacing;
    const startY = (height - layerHeight) / 2;
    return startY + nodeIndex * props.nodeSpacing;
}

function getNodeX(layerIndex) {
    return 60 + layerIndex * props.layerSpacing;
}

// Generate all node positions
const nodePositions = layers.map((layerSize, layerIndex) => {
    return Array.from({ length: layerSize }, (_, nodeIndex) => ({
        x: getNodeX(layerIndex),
        y: getNodeY(layerSize, nodeIndex),
    }));
});

// Generate connections between adjacent layers
const connections = [];
for (let l = 0; l < layers.length - 1; l++) {
    for (let i = 0; i < layers[l]; i++) {
        for (let j = 0; j < layers[l + 1]; j++) {
            connections.push({
                x1: nodePositions[l][i].x,
                y1: nodePositions[l][i].y,
                x2: nodePositions[l + 1][j].x,
                y2: nodePositions[l + 1][j].y,
            });
        }
    }
}

// Label positions
const labelY = 25;
const inputLabelX = getNodeX(0);
const outputLabelX = getNodeX(layers.length - 1);
const hiddenLabelX = (getNodeX(1) + getNodeX(layers.length - 2)) / 2;

// Bracket for hidden layers
const bracketY = 40;
const bracketStartX = getNodeX(1);
const bracketEndX = getNodeX(layers.length - 2);
</script>

<template>
    <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" class="neural-network-diagram">
        <!-- Connections -->
        <line
            v-for="(conn, i) in connections"
            :key="'conn-' + i"
            :x1="conn.x1"
            :y1="conn.y1"
            :x2="conn.x2"
            :y2="conn.y2"
            :stroke="lineColor"
            stroke-width="1"
            stroke-opacity="0.6"
        />

        <!-- Nodes -->
        <template v-for="(layer, layerIndex) in nodePositions" :key="'layer-' + layerIndex">
            <circle
                v-for="(node, nodeIndex) in layer"
                :key="'node-' + layerIndex + '-' + nodeIndex"
                :cx="node.x"
                :cy="node.y"
                :r="nodeRadius"
                :fill="fillColor"
                :stroke="strokeColor"
                stroke-width="2"
            />
        </template>

        <!-- Labels -->
        <text :x="inputLabelX" :y="labelY" text-anchor="middle" class="layer-label">Input Layer</text>
        <text :x="outputLabelX" :y="labelY" text-anchor="middle" class="layer-label">Output Layer</text>

        <!-- Hidden Layers bracket and label -->
        <text :x="hiddenLabelX" :y="labelY - 15" text-anchor="middle" class="layer-label">Hidden Layers</text>

        <!-- Bracket -->
        <path
            :d="`M ${bracketStartX} ${bracketY} L ${bracketStartX} ${bracketY - 8} L ${bracketEndX} ${bracketY - 8} L ${bracketEndX} ${bracketY}`"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-opacity="0.7"
        />
        <!-- Bracket center tick -->
        <line
            :x1="hiddenLabelX"
            :y1="bracketY - 8"
            :x2="hiddenLabelX"
            :y2="bracketY - 15"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-opacity="0.7"
        />
    </svg>
</template>

<style scoped>
.neural-network-diagram {
    display: block;
    margin: 0 auto;
}

.layer-label {
    font-size: 14px;
    font-weight: 500;
    fill: currentColor;
    opacity: 0.8;
}
</style>
