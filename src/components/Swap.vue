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
          <button @click="sellTokensNormal" class="swap-button">Swap</button>
          <div v-if="transactionMessageNormal" class="transaction-message">
            {{ transactionMessageNormal }}
        </div>
      </div>
      <div class="swap-box">
        <h2>Win Big</h2>
        <input v-model.number="apeAmountBigi" placeholder="ApeCoin to Sell" />
        <input :value="usdtRangeBigi" placeholder="USDT to Buy" readonly />
        <div class="market-price">{{ `Market price: ${usdtAmountBigi} USDT given ${apeAmountBigi} ApeCoin` }}</div>
        <div class="market-price">{{ `A chance of winning double (around ${Number(usdtAmountBigi) * 2} USDT)!` }}</div>
        <button @click="sellTokensBigi" class="swap-button">BigiSwap</button>
        <div v-if="transactionMessageBigi" class="transaction-message">
          {{ transactionMessageBigi }}
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, computed } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { ethers } from 'ethers';
import { connectWallet } from '../wallet';
import abi from '../../artifact/abi.json'; // Ensure correct path to ABI file
import contractAddressData from '../../artifact/contract_address.json';

// Reactive state
const isConnected = ref(false);
const apeAmountNormal = ref('');
const usdtAmountNormal = ref('');
const apeLowerNormal = ref('');
const apeUpperNormal = ref('');
const apeAmountBigi = ref('');
const usdtAmountBigi = ref('');
const usdtLowerBigi = ref('');
const usdtUpperBigi = ref('');
const transactionMessageNormal = ref('');
const transactionMessageBigi = ref('');

// Contract address
const contractAddress = contractAddressData.contractAddress;

// Create provider and contract instance
const connectWalletHandler = async () => {
  try {
    // Assuming connectWallet retrieves a provider or handles MetaMask connection
    const connectedProvider = await connectWallet();

    if (connectedProvider) {
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
const fetchNormalSwapResult = async (usdtAmount: string) => {
  try {
    const connectedProvider = await connectWallet();
    console.log("Connected provider:", connectedProvider);
    
    if (connectedProvider) {
      const network = await connectedProvider.getNetwork();
      console.log("Connected network:", network);

      const signer = await connectedProvider.getSigner();
      console.log("Signer:", signer)

      // Set provider and contract instances
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      const result = await contract.SwapResultOfTargetAmount(
        ethers.parseUnits("0", 18),  // _targetTokenAmount (assuming it's zero)
        ethers.parseUnits(usdtAmount.toString(), 18), // _basicTokenAmount
        1   // SellType for normal mode
      );
      console.log("Swap result:", result);

      return {
        apeLower: parseFloat(ethers.formatUnits(result[0], 18)).toFixed(2).toString(),
        apeNormal: parseFloat(ethers.formatUnits(result[1], 18)).toFixed(2).toString(),
        apeUpper: parseFloat(ethers.formatUnits(result[2], 18)).toFixed(2).toString()
      };
    }
  } catch (error) {
    console.error("Failed to fetch swap result:", error);
    return { apeLower: "0", apeNormal: "0", apeUpper: "0" };
  }
};

// Function to fetch swap results for bigi mode
const fetchBigiSwapResult = async (apeAmount: string) => {
  try {
    const connectedProvider = await connectWallet();
    console.log("Connected provider:", connectedProvider);
    
    if (connectedProvider) {
      const network = await connectedProvider.getNetwork();
      console.log("Connected network:", network);

      const signer = await connectedProvider.getSigner();
      console.log("Signer:", signer)

      // Set provider and contract instances
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      const result = await contract.SwapResultOfTargetAmount(
        ethers.parseUnits(apeAmount.toString(), 18),  // _targetTokenAmount (assuming it's zero)
        ethers.parseUnits("0", 18), // _basicTokenAmount
        0   // SellType for normal mode
      );
      console.log("Swap result:", result);

      return {
        usdtLower: parseFloat(ethers.formatUnits(result[0], 18)).toFixed(2).toString(),
        usdtNormal: parseFloat(ethers.formatUnits(result[1], 18)).toFixed(2).toString(),
        usdtUpper: parseFloat(ethers.formatUnits(result[2], 18)).toFixed(2).toString()
      };
    }
  } catch (error) {
    console.error("Failed to fetch swap result:", error);
    return { usdtLower: "0", usdtNormal: "0", usdtUpper: "0" };
  }
};

// Watcher to update apeAmount when usdtAmount changes (normal)
watchDebounced(usdtAmountNormal, async (newVal) => {
  if (newVal) {
    const { apeLower, apeNormal, apeUpper } = await fetchNormalSwapResult(newVal);
    apeLowerNormal.value = apeLower;
    apeAmountNormal.value = apeNormal;
    apeUpperNormal.value = apeUpper;
  } else {
    apeLowerNormal.value = '';
    apeAmountNormal.value = '';
    apeUpperNormal.value = '';
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
    usdtLowerBigi.value = '';
    usdtAmountBigi.value = '';
    usdtUpperBigi.value = '';
  }
}, { debounce: 500, maxWait: 1000 });

// Computed property to format the range display
const apeRangeNormal = computed(() => {
  if (apeLowerNormal.value !== '' && apeUpperNormal.value !== '') {
    return `${apeLowerNormal.value} - ${apeUpperNormal.value} ApeCoin`;
  }
  return '';
});

// Computed property to format the range display
const usdtRangeBigi = computed(() => {
  if (usdtLowerBigi.value !== '' && usdtUpperBigi.value !== '') {
    return `${usdtLowerBigi.value} - ${usdtUpperBigi.value} USDT (conservative)`;
  }
  return '';
});

// Function to handle selling tokens using Swap function
const sellTokensNormal = async () => {
  try {
    const connectedProvider = await connectWallet();
    console.log("Connected provider:", connectedProvider);
    
    if (connectedProvider) {
      const network = await connectedProvider.getNetwork();
      console.log("Connected network:", network);

      const signer = await connectedProvider.getSigner();
      console.log("Signer:", signer);

      // Set provider and contract instances
      const contract = new ethers.Contract(contractAddress, abi, signer);

      if (!signer || !usdtAmountNormal.value || !contract) {
        return;
      }

      // Validate usdtAmountNormal.value
      const valueString = usdtAmountNormal.value.toString();
      if (!valueString || valueString.trim() === "") {
        console.error("usdtAmountNormal.value is empty or invalid.");
        return;
      }

      try {
        const tx = await contract.Swap(
          ethers.parseUnits("0", 18), // _targetTokenAmount (set to 0 for your case)
          ethers.parseUnits(valueString, 18), // _basicTokenAmount
          1 // _swapType (1 for normal mode)
        );

        const receipt = await tx.wait();
        console.log(receipt)
        transactionMessageNormal.value = 'Transaction successful!';
        console.log("Transaction receipt:", receipt);
        // You can update transactionMessageNormal.value with more specific details based on your contract's functionality.
      } catch (error) {
        transactionMessageNormal.value = 'Transaction failed!';
        console.error(error);
      }
    }
  } catch (error) {
    console.error("Failed to transact:", error);
  }
};

// Function to handle selling tokens using Swap function
const sellTokensBigi = async () => {
  try {
    const connectedProvider = await connectWallet();
    console.log("Connected provider:", connectedProvider);
    
    if (connectedProvider) {
      const network = await connectedProvider.getNetwork();
      console.log("Connected network:", network);

      const signer = await connectedProvider.getSigner();
      console.log("Signer:", signer);

      // Set provider and contract instances
      const contract = new ethers.Contract(contractAddress, abi, signer);

      if (!signer || !apeAmountBigi.value || !contract) {
        return;
      }

      // Validate apeAmountNormal.value
      const valueString = apeAmountBigi.value.toString();
      if (!valueString || valueString.trim() === "") {
        console.error("apeAmountBigi.value is empty or invalid.");
        return;
      }

      try {
        const tx = await contract.Swap(
          ethers.parseUnits(valueString, 18), // _targetTokenAmount
          ethers.parseUnits("0", 18), // _basicTokenAmount
          0 // _swapType (0 for bigi mode)
        );

        const receipt = await tx.wait();
        console.log(receipt)
        transactionMessageBigi.value = 'Transaction successful!';
        console.log("Transaction receipt:", receipt);
      } catch (error) {
        transactionMessageBigi.value = 'Transaction failed!';
        console.error(error);
      }
    }
  } catch (error) {
    console.error("Failed to transact:", error);
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
