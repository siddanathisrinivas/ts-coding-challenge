import {
    AccountId,
    PrivateKey,
    AccountBalanceQuery,
    Client,
    TopicCreateTransaction,
    PublicKey,
    TopicInfoQuery,
    TopicId,
    TopicMessageSubmitTransaction,
    TopicMessageQuery,
    TokenId,
} from "@hashgraph/sdk";

export async function getAccountDetails(acct: { id: string, privateKey: string }) {
    const accountId = AccountId.fromString(acct.id);
    const privateKey = PrivateKey.fromStringED25519(acct.privateKey);
    return { accountId, privateKey };
}

export async function getAccountBalance(accountId: string, client: Client, tokenId: TokenId | null) {
    const acctBal = await new AccountBalanceQuery().setAccountId(accountId).execute(client);
    let balance;
    if (tokenId === null) {
        balance = await acctBal.hbars.toBigNumber().toNumber();
    } else {
        balance = acctBal.tokens?.get(tokenId).toNumber();
    }
    return balance;
}

export async function createTopic(submitKey: PublicKey, client: Client, memo: string) {
    const topicCreateTx = await new TopicCreateTransaction()
    .setSubmitKey(submitKey)
    .setTopicMemo(memo)
    .execute(client);

    const receipt = await topicCreateTx.getReceipt(client);
    return receipt.topicId;
}

export async function getTopicInfo(topicId: TopicId, client: Client) {
    const topicInfo = await new TopicInfoQuery()
        .setTopicId(topicId)
        .execute(client);

    return topicInfo;
}

export async function submitMsgToTopic(topicId: TopicId, client: Client, privateKey:  PrivateKey, message: string) {
    const submittedMsgTx = await new TopicMessageSubmitTransaction({
        topicId: topicId,
        message,
      })
      .freezeWith(client)
      .sign(privateKey)

      let submitMsgTxSubmit = await submittedMsgTx.execute(client);
      let getReceipt = await submitMsgTxSubmit.getReceipt(client);
      const transactionStatus: string = getReceipt.status.toString();
    return transactionStatus;
}

export async function getTopicMessage(topicId: TopicId, client: Client) {
  let recivedMsg;
  new TopicMessageQuery()
    .setTopicId(topicId)
    .setStartTime(0)
    .subscribe(client, null, (resMsg) => {
      recivedMsg = Buffer.from(resMsg.contents).toString();
      console.log(`${resMsg.consensusTimestamp.toDate()} received: ${recivedMsg}`);
    });
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return recivedMsg;
}