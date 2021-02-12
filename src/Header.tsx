import React from 'react';

type GithubLinkProps = {
  link: string;
  label: string;
}

function GithubLink(props: GithubLinkProps): JSX.Element {
  return (
    <div className="github-link">
      <img width="30px" height="30px" src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="github-logo" />
      <a href={props.link} target="_blank" rel="noopener noreferrer">{props.label}</a>
    </div>
  );
}

export function Header(): JSX.Element {
  const [show, setShow] = React.useState<boolean>(true);

  if (!show) return <button className="header-btn" onClick={(): void => setShow(true)}><b>Avro Writer</b></button>;

  return (
    <div className="header">
      <h2 className="header-label">
        Avro Writer
        <span className="header-comment">Avro in PWA</span>
        <span className="header-cross-btn"><button onClick={(): void => setShow(false)}><b>X</b></button></span>
      </h2>
      <div className="header-links">
        <GithubLink label="Avro-Pad" link="https://github.com/omicronlab/avro-pad/" />
        <GithubLink label="Avro Writer" link="https://github.com/ibrahim-13/avro-writer" />
      </div>
    </div>
  );
}