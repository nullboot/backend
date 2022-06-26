import { SelectQueryBuilder } from 'typeorm';
import { TimeRange } from './types';
import { WildcardType } from './dto';

export function FilterByCity<T>(
  query: SelectQueryBuilder<T>,
  id: number,
): SelectQueryBuilder<T> {
  return query.andWhere('user.cityId = :cityId', { cityId: id });
}

export function FilterByDivision<T>(
  query: SelectQueryBuilder<T>,
  ids: number[],
): SelectQueryBuilder<T> {
  if (ids.length === 0) return query.andWhere('1 = 0');
  if (ids.length === 1)
    return query.andWhere('user.divisionId = :divisionId', {
      divisionId: ids[0],
    });
  return query.andWhere('user.divisionId IN (:divisionIds)', {
    divisionIds: ids,
  });
}

export function FilterByRegisterTime<T>(
  query: SelectQueryBuilder<T>,
  registerTime: TimeRange,
): SelectQueryBuilder<T> {
  if (registerTime.startTime != null)
    query = query.andWhere('user.registerTime >= :startTime', {
      startTime: registerTime.startTime,
    });
  if (registerTime.endTime != null)
    query = query.andWhere('user.registerTime >= :endTime', {
      endTime: registerTime.endTime,
    });
  return query;
}

export function SearchInRealname<T>(
  query: SelectQueryBuilder<T>,
  keyword: string,
  wildcard?: WildcardType,
): SelectQueryBuilder<T> {
  if (!wildcard || wildcard === WildcardType.NONE)
    return query.andWhere('user.realname = :realname', {
      realname: keyword,
    });
  let realname = keyword || '';
  if (wildcard === WildcardType.BEGIN) realname = `%${realname}`;
  else if (wildcard === WildcardType.END) realname = `${realname}%`;
  else if (wildcard === WildcardType.BOTH) realname = `%${realname}%`;
  return query.andWhere('user.realname LIKE :realname', { realname });
}
