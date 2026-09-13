import React from"react";
export default function EntityMessage({role,content}){const isUser=role==="user";return <div className={`message-row ${isUser?"is-user":"is-emaea"}`}><div className="message-bubble">{!isUser&&<div className="message-label"><span/>EMÆÄ</div>}<div className="message-content">{content}</div></div></div>}
