using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CalendarApp.Api.Data;
using CalendarApp.Api.Entities;
using CalendarApp.Api.DTOs;

namespace CalendarApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    // 1. РЕГИСТРАЦИЯ: api/Auth/register
    [HttpPost("register")]
    public async Task<ActionResult<User>> Register(RegisterDto dto)
    {
        // Приводим Email к нижнему регистру, чтобы избежать дубликатов (Denis@urfu.ru и denis@urfu.ru)
        var normalEmail = dto.Email.ToLower().Trim();

        // Проверяем, не занят ли Email в базе данных
        if (await _context.Users.AnyAsync(u => u.Email == normalEmail))
        {
            return BadRequest(new { message = "Пользователь с таким Email уже зарегистрирован" });
        }

        // ХЭШИРУЕМ ПАРОЛЬ (сложность 12 — оптимальный баланс между скоростью работы и криптостойкостью)
        string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12);

        var user = new User
        {
            Name = dto.Name,
            Email = normalEmail,
            PasswordHash = passwordHash
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Благодаря атрибуту [JsonIgnore], который мы добавили в User.cs, 
        // поле PasswordHash автоматически отсечется и не улетит в сеть клиенту.
        return Ok(user);
    }

    // 2. ВХОД: api/Auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var normalEmail = dto.Email.ToLower().Trim();

        // Ищем пользователя по Email
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalEmail);
        if (user == null)
        {
            return BadRequest(new { message = "Неверный Email или пароль" });
        }

        // Проверяем соответствие введенного пароля хэшу из базы данных
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            // Возвращаем одинаковый текст ошибки, чтобы злоумышленники не перебирали логины
            return BadRequest(new { message = "Неверный Email или пароль" });
        }

        // Пока мы не внедрили полноценные токены авторизации (JWT), 
        // отдаем клиенту базовое подтверждение успеха и ID пользователя для фронтенда
        return Ok(new { 
            message = "Вход успешно выполнен", 
            userId = user.Id, 
            name = user.Name 
        });
    }
}