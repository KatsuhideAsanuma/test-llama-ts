import { stdin as input, stdout as output } from "node:process";
// readline/promises is still experimental so not in @types/node yet
// @ts-ignore
import readline from "node:readline/promises";
import fs from "fs/promises";
require('dotenv').config();

import {
  ContextChatEngine,
  Document,
  serviceContextFromDefaults,
  VectorStoreIndex,
} from "llamaindex";

async function main() {
    const fileContent = await fs.readFile('fitcore.json', 'utf-8');
    const json = JSON.parse(fileContent);
  
    // JSONをフラットなテキストに変換する関数
    function flattenJsonToArray(json: Record<string, any>, prefix = ''): string[] {
        let arr:string[] = [];
        for (const key in json) {
          if (typeof json[key] === 'object' && json[key] !== null) {
            arr = arr.concat(flattenJsonToArray(json[key], `${prefix}${key}.`));
          } else {
            arr.push(`${prefix}${key}: ${json[key]}`);
          }
        }
        return arr;
      }
  
    // JSONをフラットなテキストに変換
    const texts = flattenJsonToArray(json);
  
    // テキストをドキュメントとしてインデックス化
    const documents = texts.map(text => new Document({ text: text }));
    const serviceContext = serviceContextFromDefaults({ chunkSize: 512 });
    const index = await VectorStoreIndex.fromDocuments(documents, { serviceContext });  /*
    const essay = await fs.readFile(
        "node_modules/llamaindex/examples/abramov.txt",
        "utf-8",
      );
  const document = new Document({ text: essay });
  const serviceContext = serviceContextFromDefaults({ chunkSize: 512 });
  const index = await VectorStoreIndex.fromDocuments([document], {
    serviceContext,
  });
  */
  const retriever = index.asRetriever();
  retriever.similarityTopK = 5;
  const chatEngine = new ContextChatEngine({ retriever });
  const rl = readline.createInterface({ input, output });

  while (true) {
    const query = await rl.question("Query: ");
    const stream = await chatEngine.chat({ message: query, stream: true });
    console.log();
    for await (const chunk of stream) {
      process.stdout.write(chunk.response);
    }
  }
}

main().catch(console.error);
