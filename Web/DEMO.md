# Run the UI demo without npm

This demo is useful when `better-sqlite3` cannot be installed yet. It uses Python's standard library and realistic mock rates; it does **not** collect or save production data.

```bash
cd Web
python3 scripts/demo_server.py
```

Open:

```text
http://localhost:3000
```

Stop it with **Control+C**.

For real collection, SQLite history, admin entry, and deployment, use the normal Node.js instructions in `README.md` and `DEPLOYMENT.md`.
