import { wrap } from 'comlink';

export type TAvroSuggestion = {
  prevSelection: number,
  words: string[],
}

type TAvroPhonetic = {
  getVersion: () => string;
  getSuggestion: (queryText: string) => TAvroSuggestion;
  setCommit: (queryText: string, bnValue: string) => void;
}

const workerUrl = `${process.env.PUBLIC_URL ? process.env.PUBLIC_URL : ''}/avro.worker.202102220019.js`; 

const worker = new Worker(workerUrl);
const avroWroker = wrap<TAvroPhonetic>(worker);

export default avroWroker;