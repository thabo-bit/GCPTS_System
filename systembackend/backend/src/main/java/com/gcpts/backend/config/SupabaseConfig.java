package com.gcpts.backend.config;

public class SupabaseConfig {

    public static final String URL =
            System.getenv("SUPABASE_URL");

    public static final String KEY =
            System.getenv("SUPABASE_KEY");

    public static final String BUCKET =
            "image Issues";

}
