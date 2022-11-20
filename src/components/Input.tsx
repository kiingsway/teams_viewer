import React from 'react';
import { v4 as uuid } from 'uuid';

interface Props {
  id?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  labelText?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export default function Input({ id, type, placeholder, labelText, onChange, value }: Props) {

  const idd = id ? id : `input-${uuid()}`;
  const typee = type ? type : 'text';

  return (
    <div className="form-floating mb-3">

      <input
        type={typee}
        className="form-control bg-dark text-white"
        id={idd}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />

      {labelText ? <label htmlFor={idd}>{labelText}</label> : <></>}
      
    </div>
  )
}