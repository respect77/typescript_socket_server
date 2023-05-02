import fs from 'fs/promises'
import util from 'util'

const ReadFilePromises = fs.readFile;
const AppendFilePromises = fs.appendFile;

export async function FileReadJson(path: string): Promise<any> {
    try {
        var result = await fs.readFile(path, 'utf8');
        return JSON.parse(result);
    }
    catch (error) {
        console.log(error);
        return null;
    }
}

export async function FileAppend(path:string, append_data: string) {
    try {
        var result = await AppendFilePromises(path, append_data);
    }
    catch (error) {
        console.log(error);
        return null;
    }
}


export function GetRandomValue(max_value: number = 100): number {
    //max 미포함
    return Math.floor(Math.random() * max_value);
}

export function GetRandomValueFloat(): number {
    return Math.random();
}

export function GetRandomRangeValue(min_value: number, max_value: number): number {
    //min, max 포함
    return Math.floor(Math.random() * (max_value - min_value + 1)) + min_value;
}

export function GetRandomRangeValueFloat(min_value: number, max_value: number): number {
    //min, max 포함
    return (Math.random() * (max_value - min_value)) + min_value;
}

export function RandomOK(rate: number, max_rate: number = 100): boolean {
    return GetRandomValue(max_rate) < rate;
}

export function RandomOKFloat(rate: number): boolean {
    return GetRandomValueFloat() < rate;
}

export function GetListRandomValue<T>(list: Array<T>): T {
    return list[GetRandomValue(list.length)];
}

export interface RateInterface {
    rate: number;
}

export function GetRandomRateResult<T extends RateInterface>(rate_array: Array<T>, max_value: number = 100): T | undefined {
    let rate = GetRandomValue(max_value);
    return rate_array.find(data => rate < data.rate);
}

export function NumberPadding(value: number, places: number = 2) {
    return String(value).padStart(places, '0');
}

export function GetCurrentDateMSec(current_date: Date = new Date()): number {
    return current_date.getTime();
}

export function GetCurrentDateToString(current_date: Date = new Date()): string {
    //return current_date.getTime();
    return `${current_date.getFullYear()}${NumberPadding(current_date.getMonth() + 1)}\
${NumberPadding(current_date.getDate())}`;
}

export function GetCurrentDateMsecToString(current_date: Date = new Date()): string {
    //return current_date.getTime();
    return `${current_date.getFullYear()}-${NumberPadding(current_date.getMonth() + 1)}-${NumberPadding(current_date.getDate())} \
${NumberPadding(current_date.getHours())}:${NumberPadding(current_date.getMinutes())}:${NumberPadding(current_date.getSeconds())}.\
${NumberPadding(current_date.getMilliseconds())}`;
}



export const Sleep = util.promisify(setTimeout);