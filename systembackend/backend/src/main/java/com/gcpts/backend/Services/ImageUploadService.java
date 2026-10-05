package com.gcpts.backend.Services;

import com.gcpts.backend.config.SupabaseConfig;
import okhttp3.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.UUID;

@Service
public class ImageUploadService {

  private final OkHttpClient client = new OkHttpClient();

  public String uploadImage(byte[] fileBytes, String originalName)
          throws IOException {

    // Generate unique file name
    String fileName =
            UUID.randomUUID()
            + "-"
            + originalName.replace(" ", "-");

    RequestBody body = RequestBody.create(
            fileBytes,
            MediaType.parse("image/*")
    );

    String uploadUrl =
            SupabaseConfig.URL
            + "/storage/v1/object/"
            + SupabaseConfig.BUCKET
            + "/"
            + fileName;

    Request request = new Request.Builder()
            .url(uploadUrl)
            .addHeader(
                    "Authorization",
                    "Bearer " + SupabaseConfig.KEY
            )
            .addHeader(
                    "apikey",
                    SupabaseConfig.KEY
            )
            .addHeader(
                    "Content-Type",
                    "image/*"
            )
            .put(body)
            .build();

    try(Response response = client.newCall(request).execute()) {

        String responseBody =
                response.body() != null
                ? response.body().string()
                : "";

        if(!response.isSuccessful()) {
            throw new IOException(
                    "Supabase upload failed. Code: "
                    + response.code()
                    + " Error: "
                    + responseBody
            );
        }

    }

    // Public image URL
    return SupabaseConfig.URL
            + "/storage/v1/object/public/"
            + SupabaseConfig.BUCKET
            + "/"
            + fileName;

  }

}