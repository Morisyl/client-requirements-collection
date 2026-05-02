import os

def create_frontend_structure():
    base_dir = "frontend"

    # List of all the files and their relative paths
    files_to_create = [
        "index.html",
        "config.js",
        "assets/logo.png",
        "assets/favicon.png",
        "css/variables.css",
        "css/base.css",
        "css/components.css",
        "css/animations.css",
        "js/api.js",
        "js/auth.js",
        "js/router.js",
        "js/toast.js",
        "js/utils.js",
        "pages/public/home.js",
        "pages/public/forms/form-wizard.js",
        "pages/public/forms/business-name-registration.js",
        "pages/public/forms/business-name-amendments.js",
        "pages/public/forms/private-company-registration.js",
        "pages/public/forms/company-amendments.js",
        "pages/public/forms/agpo-registration.js",
        "pages/public/forms/general-compliance.js",
        "pages/public/forms/dynamic-form.js",
        "pages/public/consent.js",
        "pages/public/success.js",
        "pages/admin/login.js",
        "pages/admin/dashboard.js",
        "pages/admin/submissions-list.js",
        "pages/admin/submission-detail.js",
        "pages/admin/services-list.js",
        "pages/admin/service-editor.js",
        "components/header.js",
        "components/address-field.js",
        "components/file-upload.js",
        "components/tag-manager.js",
        "components/status-select.js",
        "components/progress-bar.js"
    ]

    print(f"🚀 Generating project structure in '{base_dir}/'...")

    for file_path in files_to_create:
        # Join base directory with the file path
        full_path = os.path.join(base_dir, file_path)
        
        # Extract the directory portion of the path
        directory = os.path.dirname(full_path)

        # Create the nested directories if they don't exist
        if directory:
            os.makedirs(directory, exist_ok=True)

        # Create the file
        with open(full_path, 'w') as f:
            # Add a basic comment based on file type
            if full_path.endswith('.js'):
                f.write('// Auto-generated JS file\n')
            elif full_path.endswith('.css'):
                f.write('/* Auto-generated CSS file */\n')
            elif full_path.endswith('.html'):
                f.write('<!-- Auto-generated HTML file -->\n')
            else:
                pass # Leave images blank for now

        print(f"✅ Created: {full_path}")

    print("\n🎉 Folder structure generated successfully!")

if __name__ == "__main__":
    create_frontend_structure()