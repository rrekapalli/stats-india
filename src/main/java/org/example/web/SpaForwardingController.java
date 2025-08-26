package org.example.web;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardingController {

    // Serve index.html for non-API routes (e.g., "/", "/dashboard", etc.)
    @GetMapping(value = {"/", "{path:[^\\.]*}"}, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<Resource> forwardToIndex() {
        Resource indexHtml = new ClassPathResource("static/index.html");
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(indexHtml);
    }
}
