<!-- src/components/Swap.vue -->
<template>
    <div class="container">
      <button v-if="!isConnected" @click="connectWalletHandler" class="connect-button">
        Connect MetaMask
      </button>
      <div v-if="isConnected" class="swap-section">
        <div class="swap-box">
          <h2>Trade Smart</h2>
          <input v-model.number="usdtAmountNormal" placeholder="USDT to Sell" />
          <input :value="apeRangeNormal" placeholder="ApeCoin to Buy" readonly />
          <div class="market-price">{{ `Market price: ${apeAmountNormal} ApeCoin given ${usdtAmountNormal} USDT` }}</div>
          <button @click="sellTokens" class="swap-button">Swap</button>
          <div v-if="transactionMessageNormal" class="transaction-message">
            {{ transactionMessageNormal }}
        </div>
      </div>
      <div class="swap-box">
        <h2>Win Big</h2>
        <input v-model.number="apeAmountBigi" placeholder="ApeCoin to Sell" />
        <input :value="usdtRangeBigi" placeholder="USDT to Buy" readonly />
        <div class="market-price">{{ `Market price: ${usdtAmountBigi} USDT given ${apeAmountBigi} ApeCoin` }}</div>
        <div class="market-price">{{ `A chance of winning double (${usdtUpperBigi} USDT)!` }}</div>
        <button @click="sellTokens" class="swap-button">BigiSwap</button>
        <div v-if="transactionMessageBigi" class="transaction-message">
          {{ transactionMessageBigi }}
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { ethers } from 'ethers';
import { connectWallet } from '../wallet';
import abi from '../../artifact/abi.json'; // Ensure correct path to ABI file
import contractAddressData from '../../artifact/contract_address.json';

// Reactive state
const signer = ref<ethers.Signer | null>(null);
const isConnected = ref(false);
const apeAmountNormal = ref<number | null>(null);
const usdtAmountNormal = ref<number | null>(null);
const apeLowerNormal = ref<number | null>(null);
const apeUpperNormal = ref<number | null>(null);
const apeAmountBigi = ref<number | null>(null);
const usdtAmountBigi = ref<number | null>(null);
const usdtLowerBigi = ref<number | null>(null);
const usdtUpperBigi = ref<number | null>(null);
const transactionMessageNormal = ref('');
const transactionMessageBigi = ref('');

// Contract address
const contractAddress = contractAddressData.contractAddress;

// Create provider and contract instance
const provider = ref<ethers.BrowserProvider | null>(null);
const contract = ref<ethers.Contract | null>(null);

const connectWalletHandler = async () => {
  try {
    // Assuming connectWallet retrieves a provider or handles MetaMask connection
    const connectedProvider = await connectWallet();

    if (connectedProvider) {
      console.log("Connected provider:", connectedProvider);

      // Set provider and contract instances
      provider.value = connectedProvider; // Use the connected provider directly
      contract.value = new ethers.Contract(contractAddress, abi, provider.value);
      
      isConnected.value = true;
    } else {
      isConnected.value = false;
    }
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    isConnected.value = false;
  }
};

// Function to fetch swap results for normal mode
const fetchNormalSwapResult = async (usdtAmount) => {
  try {
    console.log("Fetching swap result with amount:", usdtAmount);
    if (!contract.value) {
      console.error("Contract instance is not initialized.");
      return { apeLower: "0", apeNormal: "0", apeUpper: "0" };
    } else {
      console.log("Contract instance: ", contract.value)
    }
    
    if (contract.value && typeof contract.value.SwapResultOfTargetAmount === 'function') {
        console.log("Contract instance has SwapResultOfTargetAmount function.");
    } else {
        console.error("Contract instance does not have SwapResultOfTargetAmount function.");
        // Handle this case, such as returning early or displaying an error message
    }
    const result = await contract.value.SwapResultOfTargetAmount(
      ethers.parseUnits("0", 18),  // _targetTokenAmount (assuming it's zero)
      ethers.parseUnits(usdtAmount.toString(), 18), // _basicTokenAmount
      1   // SellType for normal mode
    );
    console.log("Swap result:", result);

    return {
      apeLower: ethers.formatUnits(result[0], 18),
      apeNormal: ethers.formatUnits(result[1], 18),
      apeUpper: ethers.formatUnits(result[2], 18)
    };
  } catch (error) {
    console.error("Failed to fetch swap result:", error);
    return { apeLower: "0", apeNormal: "0", apeUpper: "0" };
  }
};

// Function to fetch swap results for bigi mode
const fetchBigiSwapResult = async (apeAmount: number) => {
  if (contract.value) {
    try {
      const result = await contract.value.SwapResultOfTargetAmount(
        ethers.parseUnits(apeAmount.toString(), 18), // _targetTokenAmount
        0,  // Not used in bigi mode
        0   // SellType for bigi mode
      );
      return {
        usdtLower: ethers.formatUnits(result[0], 18),
        usdtNormal: ethers.formatUnits(result[1], 18),
        usdtUpper: ethers.formatUnits(result[2], 18)
      };
    } catch (error) {
      console.error("Failed to fetch swap result:", error);
      return { usdtLower: 0, usdtNormal: 0, usdtUpper: 0 };
    }
  }
  return { usdtLower: 0, usdtNormal: 0, usdtUpper: 0 };
};

// Watcher to update apeAmount when usdtAmount changes (normal)
watchDebounced(usdtAmountNormal, async (newVal) => {
  if (newVal) {
    console.log(newVal)
    const { apeLower, apeNormal, apeUpper } = await fetchNormalSwapResult(newVal);
    apeLowerNormal.value = apeLower;
    apeAmountNormal.value = apeNormal;
    apeUpperNormal.value = apeUpper;
  } else {
    apeLowerNormal.value = null;
    apeAmountNormal.value = null;
    apeUpperNormal.value = null;
  }
}, { debounce: 500, maxWait: 1000 });

// Watcher to update usdtAmount when apeAmount changes (bigi)
watchDebounced(apeAmountBigi, async (newVal) => {
  if (newVal) {
    const { usdtLower, usdtNormal, usdtUpper } = await fetchBigiSwapResult(newVal);
    usdtLowerBigi.value = usdtLower;
    usdtAmountBigi.value = usdtNormal;
    usdtUpperBigi.value = usdtUpper;
  } else {
    usdtLowerBigi.value = null;
    usdtAmountBigi.value = null;
    usdtUpperBigi.value = null;
  }
}, { debounce: 500, maxWait: 1000 });

// Computed property to format the range display
const apeRangeNormal = computed(() => {
  if (apeLowerNormal.value !== null && apeUpperNormal.value !== null) {
    return `${apeLowerNormal.value} - ${apeUpperNormal.value} ApeCoin`;
  }
  return '';
});

// Computed property to format the range display
const usdtRangeBigi = computed(() => {
  if (usdtLowerBigi.value !== null && usdtUpperBigi.value !== null) {
    return `${usdtLowerBigi.value} - ${usdtUpperBigi.value} USDT`;
  }
  return '';
});

// Function to handle selling tokens
const sellTokens = async () => {
  if (!signer.value || usdtAmountNormal.value === null) return;
  const transaction = {
    to: '0xYourSmartContractAddress', // Replace with your smart contract address
    value: ethers.parseUnits((usdtAmountNormal.value * marketPriceNormal).toString(), 'ether')
  };
  try {
    const tx = await signer.value.sendTransaction(transaction);
    await tx.wait();
    transactionMessageNormal.value = `You sold ${usdtAmountNormal.value} USDT tokens at ${marketPriceNormal} APE/USDT.`;
  } catch (error) {
    transactionMessageNormal.value = 'Transaction failed!';
    console.error(error);
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap');
.container {
  font-family: 'Open Sans', sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.connect-button {
  display: block;
  width: 100%;
  padding: 10px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
}

.connect-button:hover {
  background-color: #666;
}

.swap-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.swap-box {
  background-color: #d9dbf0;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.swap-box h2 {
  margin-bottom: 15px;
  font-size: 20px;
  color: #333;
}

.swap-box input {
  width: calc(100% - 20px);
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
}

.market-price {
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.swap-button {
  width: 100%;
  padding: 10px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
}

.swap-button:hover {
  background-color: #666;
}

.transaction-message {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 10px;
}
</style>
