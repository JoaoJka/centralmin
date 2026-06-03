import { monthNames } from './constants';

export function getWeekDates(offset: number, mesReferencia: number, anoReferencia: number) {
  const primeiroDiaMes = new Date(anoReferencia, mesReferencia, 1);
  let diasParaPrimeiroDomingo = (7 - primeiroDiaMes.getDay()) % 7;
  const primeiroDomingo = new Date(anoReferencia, mesReferencia, 1 + diasParaPrimeiroDomingo);
  
  const sunday = new Date(primeiroDomingo);
  sunday.setDate(primeiroDomingo.getDate() + (offset * 7));
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  
  return { sunday, saturday };
}

export function getWeeksOfMonth(mesReferencia: number, anoReferencia: number) {
  const weeks = [];
  let currentSunday = getWeekDates(0, mesReferencia, anoReferencia).sunday;
  let weekNum = 1;
  
  while (weekNum <= 6) {
    const sunday = new Date(currentSunday);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    
    const pertenceAoMes = (sunday.getMonth() === mesReferencia && sunday.getFullYear() === anoReferencia) ||
                           (saturday.getMonth() === mesReferencia && saturday.getFullYear() === anoReferencia);
    
    if (pertenceAoMes) {
      weeks.push({ sunday: new Date(sunday), saturday: new Date(saturday), weekNumber: weekNum });
      weekNum++;
    } else if (sunday.getMonth() > mesReferencia && weekNum === 1) {
      break;
    } else if (sunday.getMonth() > mesReferencia) {
      break;
    }
    
    currentSunday.setDate(currentSunday.getDate() + 7);
    if (weekNum > 10) break;
  }
  return weeks;
}

export function getMonthDates(mesReferencia: number, anoReferencia: number) {
  const firstDay = new Date(anoReferencia, mesReferencia, 1);
  const lastDay = new Date(anoReferencia, mesReferencia + 1, 0);
  return { firstDay, lastDay, year: anoReferencia, month: mesReferencia };
}

export function formatDateBR(date: Date) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return String(date.getDate()).padStart(2, '0') + ' de ' + months[date.getMonth()] + '.';
}

export function formatDateFull(date: Date) {
  return `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
}