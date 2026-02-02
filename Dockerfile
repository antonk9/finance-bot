# Используем образ с Node.js
FROM node:20

# Устанавливаем Python и pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Рабочая директория
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY requirements.txt ./

# Устанавливаем зависимости Node и Python
RUN npm install
# Флаг --break-system-packages нужен для новых версий Debian/Ubuntu в Docker
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Копируем остальной код
COPY . .

# Запуск бота
CMD ["node", "index.js"]