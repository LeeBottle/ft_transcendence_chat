import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CalendarTaskStatus } from '@repo/constants/calendar-task';

void describe('CalendarTaskStatus', () => {
  void it('keeps the public query values stable and unique', () => {
    const values = Object.values(CalendarTaskStatus);

    assert.deepEqual(values, [1, 2, 3]);
    assert.equal(new Set(values).size, values.length);
  });
});
