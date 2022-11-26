import { DateTime } from 'luxon';
import React from 'react'

interface Props {
  date: DateTime;
  className?: string;
}

export default function FriendlyDate({ date, className }: Props) {

  const now = DateTime.now().setLocale('pt-BR');
  const dateTime = date.setLocale('pt-BR');
  const friendlyDates = {
    tomorrow: `amanhã ${dateTime.toFormat('HH:mm')}`,
    today: dateTime.toFormat('HH:mm'),
    yesterday: `Ontem ${dateTime.toFormat('HH:mm')}`,
    week: `${dateTime.toFormat(`cccc`)} ${dateTime.toFormat('HH:mm')}`,
    year: `${dateTime.toFormat('dd/LL')} ${dateTime.toFormat('HH:mm')}`,
    fullDate: dateTime.toFormat('dd/LL/yy HH:mm')
  };

  const Span = ({ children }: { children: any; }) => (
    <span title={dateTime.toFormat('dd/LL/yyyy HH:mm:ss')} className={className}>
      {children}
    </span>
  );

  if (dateTime.hasSame(now.plus({ days: 1 }), 'day'))
    return <Span>{friendlyDates.tomorrow}</Span>;

  if (dateTime.hasSame(now, 'day'))
    return <Span>{friendlyDates.today}</Span>;

  if (dateTime.hasSame(now.minus({ days: 1 }), 'day'))
    return <Span>{friendlyDates.yesterday}</Span>;

  if (dateTime.hasSame(now, 'week'))
    return <Span>{friendlyDates.week}</Span>;

  if (dateTime.hasSame(now, 'year'))
    return <Span>{friendlyDates.year}</Span>;

  return <Span>{friendlyDates.fullDate}</Span>;
}
