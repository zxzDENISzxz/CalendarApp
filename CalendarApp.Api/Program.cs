using CalendarApp.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Подключаем базу данных Postgres
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Регистрируем политики CORS для разрешения запросов с фронтенда
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()   // Разрешаем запросы с любого адреса (для локальной разработки)
              .AllowAnyMethod()   // Разрешаем любые методы (GET, POST, DELETE и т.д.)
              .AllowAnyHeader();  // Разрешаем любые заголовки
    });
});

// Регистрируем контроллеры и Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Настройка Swagger для тестирования
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ХОСТИНГ И МАРШРУТИЗАЦИЯ
// Включаем CORS
app.UseCors("AllowAll");

// Регистрируем маршруты контроллеров
app.MapControllers();

// Запускаем приложение
app.Run();