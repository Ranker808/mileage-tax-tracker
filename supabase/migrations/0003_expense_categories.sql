-- Widens the expense category set beyond the original 4 (gas/maintenance/
-- supplies/other) to cover categories a real Schedule-C/actual-expense
-- filer needs: insurance, parking & tolls, registration & fees, and loan
-- interest. Existing rows are unaffected -- their categories all stay
-- valid under the new, larger set.
alter table expenses drop constraint if exists expenses_category_check;
alter table expenses add constraint expenses_category_check
  check (category in (
    'gas', 'maintenance', 'supplies', 'insurance', 'parking_tolls', 'registration_fees', 'interest', 'other'
  ));
