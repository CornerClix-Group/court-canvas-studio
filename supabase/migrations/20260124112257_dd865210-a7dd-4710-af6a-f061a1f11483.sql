-- Add annotations column to estimate_attachments table
ALTER TABLE estimate_attachments
ADD COLUMN annotations JSONB DEFAULT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN estimate_attachments.annotations IS 'JSON structure for storing drawing annotations: {version: 1, elements: [{type, x1, y1, x2, y2, color, width, text, value}]}';