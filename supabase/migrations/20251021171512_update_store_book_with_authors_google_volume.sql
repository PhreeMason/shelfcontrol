CREATE OR REPLACE FUNCTION store_book_with_authors(
    book_data JSONB
) RETURNS TEXT AS $$

DECLARE
    inserted_book_id TEXT;
    inserted_author_id TEXT;
    author_name TEXT;
BEGIN
    INSERT INTO books (
        api_id, api_source, google_volume_id, cover_image_url, created_at,
        description, edition, format, genres, id, isbn10, isbn13,
        language, metadata, publication_date, publisher, rating,
        title, total_duration, total_pages, updated_at
    ) VALUES (
        book_data->>'api_id',
        book_data->>'api_source',
        book_data->>'google_volume_id',
        book_data->>'cover_image_url',
        COALESCE((book_data->>'created_at')::TIMESTAMPTZ, NOW()),
        book_data->>'description',
        book_data->'edition',
        (book_data->>'format')::book_format_enum,
        (SELECT ARRAY(SELECT jsonb_array_elements_text(book_data->'genres'))),
        COALESCE(book_data->>'id', generate_prefixed_id('book')),
        book_data->>'isbn10',
        book_data->>'isbn13',
        book_data->>'language',
        book_data->'metadata',
        COALESCE((book_data->>'publication_date')::TIMESTAMPTZ, NULL),
        book_data->>'publisher',
        (book_data->>'rating')::NUMERIC,
        book_data->>'title',
        (book_data->>'total_duration')::INTEGER,
        (book_data->>'total_pages')::INTEGER,
        NOW()
    )
    ON CONFLICT (api_id)
    DO UPDATE SET
        google_volume_id = COALESCE(books.google_volume_id, EXCLUDED.google_volume_id),
        cover_image_url = EXCLUDED.cover_image_url,
        description = EXCLUDED.description,
        genres = EXCLUDED.genres,
        metadata = EXCLUDED.metadata,
        rating = EXCLUDED.rating,
        updated_at = NOW()
    RETURNING id INTO inserted_book_id;

    IF book_data->'metadata'->'authors' IS NOT NULL AND jsonb_array_length(book_data->'metadata'->'authors') > 0 THEN
        FOR author_name IN SELECT jsonb_array_elements_text(book_data->'metadata'->'authors')
        LOOP
            INSERT INTO authors (name, id)
            VALUES (author_name, generate_prefixed_id('auth'))
            ON CONFLICT (name) DO NOTHING
            RETURNING id INTO inserted_author_id;

            IF inserted_author_id IS NULL THEN
                SELECT id INTO inserted_author_id FROM authors WHERE name = author_name;
            END IF;

            INSERT INTO book_authors (book_id, author_id)
            VALUES (inserted_book_id, inserted_author_id)
            ON CONFLICT (book_id, author_id)
            DO NOTHING;
        END LOOP;
    END IF;

    RETURN inserted_book_id;
END;
$$ LANGUAGE plpgsql;
