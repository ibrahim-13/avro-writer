import * as fs from 'fs';
import * as path from 'path';

// importScripts("/avro.min.js");
// importScripts("/comlink.min.js");

const PathEnvProduction = path.join(__dirname, '..', '.env.production');
const PathAvroWorkerJs = path.join(__dirname, '..', 'build', 'avro.worker.js');

const envProduction = fs.readFileSync(PathEnvProduction).toString();

const vars = envProduction.split('\n');

for (let i = 0; i < vars.length; i++) {
  const _var = vars[i].split('=');
  if (_var[0] && _var[1] && _var[0] === 'PUBLIC_URL') {
    const urlPrefix = _var[1].trim();
    const avroWorkerJs = fs.readFileSync(PathAvroWorkerJs).toString();
    const newAvroWorkerJs = avroWorkerJs
      .replace('importScripts("/avro.min.js");', `importScripts("${urlPrefix}/avro.min.js");`)
      .replace('importScripts("/comlink.min.js");', `importScripts("${urlPrefix}/comlink.min.js");`);
    fs.writeFileSync(PathAvroWorkerJs, newAvroWorkerJs);
  }
}