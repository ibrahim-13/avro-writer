import { TAvroSuggestion } from './avroLib';

type Props = {
  suggestions?: TAvroSuggestion;
  onSelect?: (word: string) => void;
}

export function Suggestion(props: Props): JSX.Element {
  return (
    <div className="suggestion">
      {props.suggestions && props.suggestions.words.length > 0 ? (
        props.suggestions.words.map((s, i) => (
          <div
            key={`${s}_${i}`}
            style={{ cursor: 'pointer' }}
            className={`suggest${props.suggestions?.prevSelection === i ? ' selected' : ''}`}
            onClick={(): void => props.onSelect?.(s)}
          >
            {s}
          </div>
        ))
      ) : (
          <div className="suggest">No suggestion</div>
        )}
    </div>
  );
}