<!-- src/components/Swap.vue -->
<template>
  <div>
    <button v-if="!isConnected" @click="connectWalletHandler">Connect MetaMask</button>
    <div v-if="isConnected">
      <input v-model.number="usdtAmountNormal" placeholder="USDT to Sell" />
      <input :value="apeRangeNormal" placeholder="ApeCoin to Buy" readonly />
      <div>{{ `market price: ${apeAmountNormal}` }}</div>
      <button @click="sellTokens">Swap</button>
      <div v-if="transactionMessageNormal">{{ transactionMessageNormal }}</div>
    </div>
    <div v-if="isConnected">
      <input v-model.number="apeAmountBigi" placeholder="ApeCoin to Sell" />
      <input :value="usdtRangeBigi" placeholder="USDT to Buy" readonly />
      <div>{{ `market price: ${usdtAmountBigi}` }}</div>
      <button @click="sellTokens">BigiSwap</button>
      <div v-if="transactionMessageBigi">{{ transactionMessageBigi }}</div>
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
  apeAmountNormal.value = newVal ? newVal * marketPriceNormal : null;
  apeLowerNormal.value = newVal ? newVal * marketPriceNormal * 0.9 : null;
  apeUpperNormal.value = newVal ? newVal * marketPriceNormal * 1.1 : null;
}, { debounce: 500, maxWait: 1000 });

// Watcher to update usdtAmount when apeAmount changes (bigi)
watchDebounced(apeAmountBigi, (newVal) => {
  usdtAmountBigi.value = newVal ? newVal * marketPriceBigi : null;
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
    return `${apeLowerNormal.value.toFixed(2)} - ${apeUpperNormal.value.toFixed(2)}`;
  }
  return '';
});

// Computed property to format the range display
const usdtRangeBigi = computed(() => {
  if (usdtLowerBigi.value !== null && usdtUpperBigi.value !== null) {
    return `${usdtLowerBigi.value.toFixed(2)} - ${usdtUpperBigi.value.toFixed(2)}`;
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
button {
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
