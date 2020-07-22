import { wrap } from 'comlink';

type TSuggest = {
  prevSelection: number,
  words: string[],
}

type TAvroPhonetic = {
  getVersion: () => string;
  getSuggestion: (queryText: string) => TSuggest;
  setCommit: (queryText: string, bnValue: string) => void;
}

const worker = new Worker('/avro.worker.js');
const avroWroker = wrap<TAvroPhonetic>(worker);

export default avroWroker;