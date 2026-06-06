using System.ComponentModel.DataAnnotations;

namespace CalendarApp.Api.DTOs;

public class RegisterDto
{
    // Изменили private на public, чтобы атрибут видел константу
    public const int MaxPasswordLength = 25;
    public const int MinPasswordLength = 6;

    [Required(ErrorMessage = "Имя обязательно для заполнения")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email обязателен для заполнения")]
    [EmailAddress(ErrorMessage = "Некорректный формат Email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Пароль обязателен для заполнения")]
    // {1} автоматически заменится на MaxPasswordLength, а {2} на MinimumLength
    [StringLength(MaxPasswordLength, MinimumLength = MinPasswordLength, ErrorMessage = "Пароль должен быть от {2} до {1} символов")]
    public string Password { get; set; } = string.Empty;
}