import {
    AccountCreateTransaction,
    AccountId,
    Client,
    Hbar,
    PrivateKey,
    TokenAssociateTransaction,
    TokenCreateTransaction,
    TokenId,
    TokenInfoQuery,
    TokenMintTransaction,
    TokenSupplyType,
    TokenType,
    TransactionId,
    TransferTransaction,
} from "@hashgraph/sdk";

export async function createToken(supplyType: TokenSupplyType, initialSupply: number, accountId: AccountId, maxSupply: number | null, privateKey: PrivateKey, client: Client, ) {
    const supplyKey = PrivateKey.generate();
    let nftCreate = await new TokenCreateTransaction()
        .setTokenName("Test Token")
        .setTokenSymbol("HTT")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)
        .setInitialSupply(initialSupply)
        .setTreasuryAccountId(accountId)
        .setSupplyType(supplyType)
        .setSupplyKey(supplyKey.publicKey)
        .setMaxTransactionFee(new Hbar(100))

    if (supplyType === TokenSupplyType.Finite && maxSupply !== null) {
        nftCreate = nftCreate.setMaxSupply(maxSupply);
    }

    nftCreate = nftCreate.freezeWith(client);
    const nftCreateTxSign = await nftCreate.sign(privateKey);
    //Submit the transaction to a Hedera network
    const nftCreateSubmit = await nftCreateTxSign.execute(client);
    //Get the transaction receipt
    const nftCreateRx = await nftCreateSubmit.getReceipt(client);
    const tokenId = nftCreateRx.tokenId;
    const statusOfCreation  = nftCreateRx.status.toString();

    return { tokenId, supplyKey, statusOfCreation };
}

export async function getTokenInfo(tokenId: TokenId, client: Client) {
    const tokenInfo = new TokenInfoQuery().setTokenId(tokenId).execute(client);
    return tokenInfo
}

export async function mintTokenTx(tokenId: TokenId, noOfMintAccts: number, supplyKey: PrivateKey, client: Client) {
    const tokenMintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(noOfMintAccts)
        .setMaxTransactionFee(new Hbar(100))
        .freezeWith(client);

    //Sign with the supply private key of the token 
    const signTx = await tokenMintTx.sign(supplyKey);
    //Submit the transaction to a Hedera network    
    const txResponse = await signTx.execute(client);
    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);
    const transactionStatus =  receipt.status.toString();
    return transactionStatus;
}

export async function createAccount(client: Client, initialBalance: number) {
    const privateKey = PrivateKey.generate();

    const receipt = await (await new AccountCreateTransaction().setInitialBalance(initialBalance).setKey(privateKey)
        .execute(client)).getReceipt(client)
    const accountId = receipt.accountId;

    return { accountId, privateKey };
}

export async function associateToken(tokenId: TokenId, accountId: AccountId, privateKey: PrivateKey, client: Client) {
    const tokenAssociateTx = new TokenAssociateTransaction()
        .setAccountId(accountId)
        .setTokenIds([tokenId])
        .freezeWith(client);

    const tokenAssociateSignTx = await (await tokenAssociateTx.sign(privateKey));
    const tokenAssociateRx = await tokenAssociateSignTx.execute(client);
    let receipt = await tokenAssociateRx.getReceipt(client);
    const transactionStatus =  receipt.status.toString();
    return transactionStatus;
}
export async function transferToken(tokenId: TokenId, accountIdFrom: AccountId, accountIdTo: AccountId, tokenBalance: number, transactionId: TransactionId | null, privateKey: PrivateKey | null, client: Client) {
    let tokenTransferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, accountIdFrom, -1 * tokenBalance)
        .addTokenTransfer(tokenId, accountIdTo, tokenBalance);
    if (transactionId !== null) {
        tokenTransferTx = tokenTransferTx.setTransactionId(transactionId);
    }
    tokenTransferTx = tokenTransferTx.freezeWith(client);
    if (privateKey !== null) {
        tokenTransferTx = await tokenTransferTx.sign(privateKey);
        if (transactionId !== null) {
            return tokenTransferTx;
        }
        const tokenTransferRx = await tokenTransferTx.execute(client);
        let receipt = await tokenTransferRx.getReceipt(client);
        const transactionStatus =  receipt.status.toString();
        return transactionStatus;
    } else {
        return tokenTransferTx;
    }
}
