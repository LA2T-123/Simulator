// DOM Elements
const difficultySlider = document.getElementById('difficulty');
const difficultyValue = document.getElementById('difficulty-value');
const hashrateSlider = document.getElementById('hashrate');
const hashrateValue = document.getElementById('hashrate-value');
const powerSlider = document.getElementById('power');
const powerValue = document.getElementById('power-value');
const electricityInput = document.getElementById('electricity');
const startMiningBtn = document.getElementById('start-mining');
const stopMiningBtn = document.getElementById('stop-mining');
const minedBlocksEl = document.getElementById('mined-blocks');
const bitcoinEarnedEl = document.getElementById('bitcoin-earned');
const usdValueEl = document.getElementById('usd-value');
const powerCostEl = document.getElementById('power-cost');
const profitLossEl = document.getElementById('profit-loss');
const miningStatusEl = document.getElementById('mining-status');
const currentHashEl = document.getElementById('current-hash');
const targetHashEl = document.getElementById('target-hash');
const sessionTimeEl = document.getElementById('session-time');
const hashesCalculatedEl = document.getElementById('hashes-calculated');
const btcPriceEl = document.getElementById('btc-price');
const networkDifficultyEl = document.getElementById('network-difficulty');
const miningRig = document.querySelector('.mining-rig');
const statusLight = document.querySelector('.status-light');

// Create speed check elements - REMOVED TIMER, ENHANCED MINING SPEED
const speedCheckEl = document.createElement('div');
speedCheckEl.className = 'speed-check';
speedCheckEl.innerHTML = `
    <div class="speed-info">
        <div class="speed-stat">
            <h3>Mining Speed</h3>
            <p id="mining-speed">0 H/s</p>
            <div class="speed-indicator">
                <div class="speed-bar" id="speed-indicator-bar"></div>
            </div>
        </div>
    </div>
`;

// Insert speed check before hash display
document.querySelector('.hash-display').before(speedCheckEl);

// Add speed check styles
const speedCheckStyle = document.createElement('style');
speedCheckStyle.textContent = `
    .speed-check {
        width: 100%;
        background-color: #f4f4f4;
        border-radius: 5px;
        padding: 15px;
        margin-bottom: 20px;
    }
    
    .speed-info {
        display: flex;
        justify-content: center;
    }
    
    .speed-stat {
        text-align: center;
        width: 100%;
    }
    
    .speed-stat h3 {
        font-size: 1rem;
        margin-bottom: 5px;
        color: #666;
    }
    
    .speed-stat p {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 10px;
    }
    
    .speed-indicator {
        width: 100%;
        height: 10px;
        background-color: #e0e0e0;
        border-radius: 5px;
        overflow: hidden;
        margin: 0 auto;
    }
    
    .speed-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, var(--primary-color), #ff8f00);
        border-radius: 5px;
        transition: width 0.5s ease;
    }
    
    @keyframes pulse {
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
    }
    
    .mining-active #mining-speed {
        animation: pulse 1.5s infinite;
    }
`;
document.head.appendChild(speedCheckStyle);

// Target goal
const BTC_TARGET = 1.0;
const targetProgressEl = document.createElement('div');
targetProgressEl.className = 'target-progress';
targetProgressEl.innerHTML = `
    <h3>Target: 1 BTC</h3>
    <div class="progress-container">
        <div class="progress-bar" id="btc-progress-bar"></div>
    </div>
    <p id="btc-progress-text">0%</p>
`;

// Insert target progress after mining stats
document.querySelector('.mining-stats').appendChild(targetProgressEl);

// Add progress bar styles
const style = document.createElement('style');
style.textContent = `
    .target-progress {
        grid-column: 1 / -1;
        background-color: #f9f9f9;
        border-radius: 5px;
        padding: 15px;
        text-align: center;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        margin-top: 10px;
    }
    .progress-container {
        width: 100%;
        height: 20px;
        background-color: #e0e0e0;
        border-radius: 10px;
        margin: 10px 0;
        overflow: hidden;
    }
    .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--primary-color), #ff8f00);
        width: 0%;
        transition: width 0.5s ease;
        border-radius: 10px;
        position: relative;
    }
    #btc-progress-text {
        font-weight: bold;
        color: var(--primary-color);
    }
`;
document.head.appendChild(style);

// Mining Variables
let isMining = false;
let miningInterval;
let sessionStartTime;
let minedBlocks = 0;
let bitcoinEarned = 0;
let hashesCalculated = 0;
let sessionSeconds = 0;
let sessionTimer;
let chartUpdateInterval;
let btcPrice = 40000; // Default BTC price in USD
let profitData = [];
let timeData = [];
let lastHashTime = 0;
let hashesPerSecond = 0;
let speedUpdateInterval;
const HASH_INTERVAL = 1000; // 1-second interval for hash generation

// Chart Configuration
let miningChart;

// Initialize the chart
function initChart() {
    const ctx = document.getElementById('mining-chart').getContext('2d');
    miningChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Profit/Loss (USD)',
                data: [],
                borderColor: '#4a90e2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (minutes)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'USD'
                    }
                }
            }
        }
    });
}

// Initialize the simulator
function init() {
    // Set up event listeners for sliders
    difficultySlider.addEventListener('input', () => {
        difficultyValue.textContent = difficultySlider.value;
        updateTargetHash();
    });

    hashrateSlider.addEventListener('input', () => {
        hashrateValue.textContent = hashrateSlider.value;
    });

    powerSlider.addEventListener('input', () => {
        powerValue.textContent = powerSlider.value;
    });

    // Set up mining buttons
    startMiningBtn.addEventListener('click', startMining);
    stopMiningBtn.addEventListener('click', stopMining);

    // Initialize chart
    initChart();

    // Fetch BTC price (simulated)
    fetchBTCPrice();

    // Update target hash based on initial difficulty
    updateTargetHash();
}

// Fetch BTC price (simulated)
function fetchBTCPrice() {
    // In a real app, you would fetch from an API
    // For this simulator, we'll use a random price around $40,000
    btcPrice = 40000 + (Math.random() * 5000 - 2500);
    btcPriceEl.textContent = `$${btcPrice.toFixed(2)}`;

    // Update every 30 seconds
    setTimeout(fetchBTCPrice, 30000);
}

// Update target hash based on difficulty
function updateTargetHash() {
    const difficulty = parseInt(difficultySlider.value);
    const difficultyText = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
    networkDifficultyEl.textContent = difficultyText[difficulty - 1];
    
    // Create a target hash with leading zeros based on difficulty
    let targetPrefix = '';
    for (let i = 0; i < difficulty; i++) {
        targetPrefix += '0';
    }
    
    const remainingChars = '0'.repeat(64 - targetPrefix.length);
    targetHashEl.textContent = targetPrefix + remainingChars;
}

// Generate a random hash
function generateRandomHash() {
    const characters = '0123456789abcdef';
    let hash = '';
    
    for (let i = 0; i < 64; i++) {
        hash += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return hash;
}

// Check if hash meets target difficulty
function checkHashMeetsDifficulty(hash, difficulty) {
    // Check if hash has enough leading zeros based on difficulty
    for (let i = 0; i < difficulty; i++) {
        if (hash[i] !== '0') {
            return false;
        }
    }
    return true;
}

// Update progress towards 1 BTC target
function updateBTCProgress() {
    const progressPercent = (bitcoinEarned / BTC_TARGET) * 100;
    const progressBar = document.getElementById('btc-progress-bar');
    const progressText = document.getElementById('btc-progress-text');
    
    progressBar.style.width = `${Math.min(progressPercent, 100)}%`;
    progressText.textContent = `${progressPercent.toFixed(2)}% (${bitcoinEarned.toFixed(8)} BTC)`;
    
    // Check if target reached
    if (bitcoinEarned >= BTC_TARGET) {
        stopMining();
        miningStatusEl.textContent = "Target Reached! 🎉";
        alert("Congratulations! You've reached the target of 1 BTC!");
    }
}

// Update mining speed display
function updateSpeedDisplay() {
    const speedEl = document.getElementById('mining-speed');
    const speedBar = document.getElementById('speed-indicator-bar');
    
    // Calculate hashes per second
    const now = Date.now();
    const timeDiff = (now - lastHashTime) / 1000;
    lastHashTime = now;
    
    // Update speed display
    if (isMining) {
        const hashrate = parseFloat(hashrateSlider.value);
        hashesPerSecond = hashrate;
        
        // Format the display based on the size of the number
        let speedDisplay;
        if (hashesPerSecond >= 1000000) {
            speedDisplay = `${(hashesPerSecond / 1000000).toFixed(2)} MH/s`;
        } else if (hashesPerSecond >= 1000) {
            speedDisplay = `${(hashesPerSecond / 1000).toFixed(2)} KH/s`;
        } else {
            speedDisplay = `${hashesPerSecond.toFixed(2)} H/s`;
        }
        
        speedEl.textContent = speedDisplay;
        
        // Update speed bar - max out at 100 KH/s for the bar display
        const maxDisplayHashrate = 100000; // 100 KH/s
        const barPercentage = Math.min((hashesPerSecond / maxDisplayHashrate) * 100, 100);
        speedBar.style.width = `${barPercentage}%`;
        
        // Add mining active class to parent for pulse animation
        document.querySelector('.speed-check').classList.add('mining-active');
    } else {
        speedEl.textContent = '0 H/s';
        speedBar.style.width = '0%';
        document.querySelector('.speed-check').classList.remove('mining-active');
    }
}

// Start mining
function startMining() {
    if (isMining) return;
    
    isMining = true;
    startMiningBtn.disabled = true;
    stopMiningBtn.disabled = false;
    miningStatusEl.textContent = 'Mining...';
    miningRig.classList.add('mining');
    
    // Reset session data if starting fresh
    if (!sessionStartTime) {
        sessionStartTime = new Date();
        sessionSeconds = 0;
        profitData = [];
        timeData = [];
        miningChart.data.labels = [];
        miningChart.data.datasets[0].data = [];
        miningChart.update();
    }
    
    // Start session timer
    sessionTimer = setInterval(updateSessionTime, 1000);
    
    // Start mining process
    const difficulty = parseInt(difficultySlider.value);
    const hashrate = parseFloat(hashrateSlider.value);
    
    // Initialize speed tracking
    lastHashTime = Date.now();
    speedUpdateInterval = setInterval(updateSpeedDisplay, 500); // Update speed more frequently
    
    miningInterval = setInterval(() => {
        // Calculate how many hashes to generate in this interval
        const hashesPerInterval = Math.max(1, Math.round(hashrate / (1000 / HASH_INTERVAL)));
        
        // Generate multiple hashes based on hashrate
        let blockFound = false;
        for (let i = 0; i < hashesPerInterval && !blockFound; i++) {
            // Generate a new hash
            const hash = generateRandomHash();
            currentHashEl.textContent = hash;
            hashesCalculated++;
            hashesCalculatedEl.textContent = hashesCalculated.toLocaleString();
            
            // Check if hash meets difficulty
            if (checkHashMeetsDifficulty(hash, difficulty)) {
                // Block found!
                blockFound = true;
                minedBlocks++;
                minedBlocksEl.textContent = minedBlocks;
                
                // Calculate reward (simplified)
                const blockReward = 6.25 / (2 ** Math.floor(minedBlocks / 210000)); // Halving every 210,000 blocks
                bitcoinEarned += blockReward;
                bitcoinEarnedEl.textContent = `${bitcoinEarned.toFixed(8)} BTC`;
                
                // Update USD value
                const usdValue = bitcoinEarned * btcPrice;
                usdValueEl.textContent = `$${usdValue.toFixed(2)}`;
                
                // Calculate power cost
                updatePowerCost();
                
                // Flash animation for successful mining
                miningRig.classList.add('success');
                setTimeout(() => {
                    miningRig.classList.remove('success');
                }, 500);
                
                // Update BTC progress
                updateBTCProgress();
            }
        }
    }, HASH_INTERVAL);
    
    // Update chart every minute
    chartUpdateInterval = setInterval(updateChart, 60000);
}

// Stop mining
function stopMining() {
    if (!isMining) return;
    
    isMining = false;
    startMiningBtn.disabled = false;
    stopMiningBtn.disabled = true;
    miningStatusEl.textContent = 'Stopped';
    miningRig.classList.remove('mining');
    
    clearInterval(miningInterval);
    clearInterval(sessionTimer);
    clearInterval(chartUpdateInterval);
    clearInterval(speedUpdateInterval);
    
    // Reset speed display
    document.getElementById('mining-speed').textContent = '0 H/s';
    document.getElementById('speed-indicator-bar').style.width = '0%';
    document.querySelector('.speed-check').classList.remove('mining-active');
}

// Update session time
function updateSessionTime() {
    sessionSeconds++;
    const hours = Math.floor(sessionSeconds / 3600);
    const minutes = Math.floor((sessionSeconds % 3600) / 60);
    const seconds = sessionSeconds % 60;
    
    sessionTimeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update power cost every second
    updatePowerCost();
}

// Update power cost
function updatePowerCost() {
    const powerConsumption = parseInt(powerSlider.value);
    const electricityCost = parseFloat(electricityInput.value);
    
    // Calculate kWh used
    const hoursRunning = sessionSeconds / 3600;
    const kWhUsed = (powerConsumption / 1000) * hoursRunning;
    const powerCost = kWhUsed * electricityCost;
    
    powerCostEl.textContent = `$${powerCost.toFixed(2)}`;
    
    // Update profit/loss
    const usdValue = bitcoinEarned * btcPrice;
    const profitLoss = usdValue - powerCost;
    
    profitLossEl.textContent = `$${profitLoss.toFixed(2)}`;
    
    // Set color based on profit/loss
    if (profitLoss > 0) {
        profitLossEl.style.color = 'var(--success-color)';
    } else if (profitLoss < 0) {
        profitLossEl.style.color = 'var(--danger-color)';
    } else {
        profitLossEl.style.color = '#333';
    }
}

// Update chart with new data
function updateChart() {
    const usdValue = bitcoinEarned * btcPrice;
    const powerConsumption = parseInt(powerSlider.value);
    const electricityCost = parseFloat(electricityInput.value);
    const hoursRunning = sessionSeconds / 3600;
    const kWhUsed = (powerConsumption / 1000) * hoursRunning;
    const powerCost = kWhUsed * electricityCost;
    const profitLoss = usdValue - powerCost;
    
    // Add data to arrays
    const minutes = Math.floor(sessionSeconds / 60);
    timeData.push(minutes);
    profitData.push(profitLoss);
    
    // Update chart
    miningChart.data.labels = timeData;
    miningChart.data.datasets[0].data = profitData;
    miningChart.update();
}

// Add success animation class
document.documentElement.style.setProperty('--success-animation', `
    @keyframes success {
        0% { box-shadow: 0 0 10px var(--success-color); }
        50% { box-shadow: 0 0 30px var(--success-color); }
        100% { box-shadow: 0 0 10px var(--success-color); }
    }
`);

// Initialize the simulator when the DOM is loaded
document.addEventListener('DOMContentLoaded', init); 