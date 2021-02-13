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

const worker = new Worker('/avro.worker.js');
const avroWroker = wrap<TAvroPhonetic>(worker);

export default avroWroker;