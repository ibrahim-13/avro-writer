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
  return (
    <div>
      <h1 className="heading">
        Avro Writer
        <span className="heading-comment">Avro in PWA</span>
      </h1>
      <div className="header-links">
        <GithubLink label="Avro-Pad" link="https://github.com/omicronlab/avro-pad/" />
        <GithubLink label="Avro Writer" link="https://github.com/ibrahim-13/avro-writer" />
      </div>
    </div>
  );
}