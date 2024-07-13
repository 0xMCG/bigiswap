// src/wallet.ts
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

export async function connectWallet(): Promise<ethers.BrowserProvider| null> {
    const provider: any = await detectEthereumProvider();
    if (provider) {
        await provider.request({ method: 'eth_requestAccounts' });
        return new ethers.BrowserProvider(provider);
    } else {
        console.error('Please install MetaMask!');
        return null;
    }
}