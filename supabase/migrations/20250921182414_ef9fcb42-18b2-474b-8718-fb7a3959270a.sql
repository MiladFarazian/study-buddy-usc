-- Add no-show tracking column to sessions table
ALTER TABLE sessions 
ADD COLUMN no_show_report TEXT NULL;