import React from 'react';
import { TAvroSuggestion } from './avroLib';

type Props = {
  suggestions?: TAvroSuggestion;
}

export function Suggestion(props: Props): JSX.Element {
  return (
    <div className="suggestion">
      {props.suggestions && props.suggestions.words.length > 0 ? (
        props.suggestions.words.map(s => <div key={Date.now()} className="suggest">{s}</div>)
      ) : (
          <div className="suggest">No suggestion</div>
        )}
    </div>
  );
}