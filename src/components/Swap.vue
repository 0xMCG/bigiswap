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

// Market price
const marketPriceNormal = 0.01; // Assume flat price
const marketPriceBigi = 100

// Watcher to update apeAmount when usdtAmount changes (normal)
watchDebounced(usdtAmountNormal, (newVal) => {
  apeAmountNormal.value = newVal ? newVal * marketPriceNormal * 1.0 : null;
  apeLowerNormal.value = newVal ? newVal * marketPriceNormal * 0.9 : null;
  apeUpperNormal.value = newVal ? newVal * marketPriceNormal * 1.1 : null;
}, { debounce: 500, maxWait: 1000 });

// Watcher to update usdtAmount when apeAmount changes (bigi)
watchDebounced(apeAmountBigi, (newVal) => {
  usdtAmountBigi.value = newVal ? newVal * marketPriceBigi * 1.0 : null;
  usdtLowerBigi.value = newVal ? newVal * marketPriceBigi * 0.9 : null;
  usdtUpperBigi.value = newVal ? newVal * marketPriceBigi * 2 : null;
}, { debounce: 500, maxWait: 1000 });

// Function to connect to MetaMask
const connectWalletHandler = async () => {
  signer.value = await connectWallet();
  isConnected.value = !!signer.value;
};

// Computed property to format the range display
const apeRangeNormal = computed(() => {
  if (apeLowerNormal.value !== null && apeUpperNormal.value !== null) {
    return `${apeLowerNormal.value.toFixed(2)} - ${apeUpperNormal.value.toFixed(2)} ApeCoin`;
  }
  return '';
});

// Computed property to format the range display
const usdtRangeBigi = computed(() => {
  if (usdtLowerBigi.value !== null && usdtUpperBigi.value !== null) {
    return `${usdtLowerBigi.value.toFixed(2)} - ${usdtUpperBigi.value.toFixed(2)} USDT`;
  }
  return '';
});

// Function to handle selling tokens
const sellTokens = async () => {
  if (!signer.value || usdtAmountNormal.value === null) return;
  const transaction = {
    to: '0xYourSmartContractAddress', // Replace with your smart contract address
    value: ethers.utils.parseUnits((usdtAmountNormal.value * marketPriceNormal).toString(), 'ether')
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
