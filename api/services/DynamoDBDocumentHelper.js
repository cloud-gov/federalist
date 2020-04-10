const AWS = require('aws-sdk');
const { logger } = require('../../winston');

class DynamoDBDocumentHelper {
  constructor(credentials) {
    this.docClient = new AWS.DynamoDB.DocumentClient({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region,
    });
  }

  put(TableName, Item) {
    let attempt = 0;
    let start;
    const { docClient } = this;
    // const itemStr = `${params.TableName}: ${itemKey}@${params.Item[itemKey]}`;
    // return new Promise((resolve, reject) => {
      const request = (params) => new Promise((resolve, reject) => {
        docClient.put(params, (err, data) => {
          if (err) {
            return reject(err);
          }
          return resolve(data);
        });
      });
      const params = {
        TableName,
        Item
      };
      return request(params);
  }

  batchWrite(TableName, items) {
    const { docClient } = this;

    const request = (params) => new Promise((resolve, reject) => {
      docClient.batchWrite(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });

    const allRequests = [];
    const RequestItems = {}
    let params;
    let i = 0;
    const maxItems = 15;
    for (i = 0; i < items.length; i += maxItems) {
      RequestItems[TableName] = items.slice(i, i + maxItems);
      params = { RequestItems };
      allRequests << request(params);
    }
    return Promise.all(allRequests);
  }


  delete(TableName, Key) {
    let attempt = 0;
    let start;
    const { docClient } = this;

    const request = (params) => new Promise((resolve, reject) => {
      docClient.delete(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
    const params = {
      TableName,
      Key,
    };
    return request(params);
  }
}

module.exports = { DynamoDBDocumentHelper };
