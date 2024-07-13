// src/wallet.ts
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

export async function connectWallet(): Promise<ethers.Signer | null> {
    const provider: any = await detectEthereumProvider();
    if (provider) {
        const web3Provider = new ethers.BrowserProvider(provider);
        await provider.request({ method: 'eth_requestAccounts' });
        return web3Provider.getSigner();
    } else {
        console.error('Please install MetaMask!');
        return null;
    }
}