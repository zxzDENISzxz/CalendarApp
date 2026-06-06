using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CalendarApp.Api.Data;
using CalendarApp.Api.Entities;
using CalendarApp.Api.DTOs;

namespace CalendarApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class GroupsController : ControllerBase
{
    private readonly AppDbContext _context;

    public GroupsController(AppDbContext context)
    {
        _context = context;
    }

    // 1. Получить все группы
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GroupDto>>> GetGroups()
    {
        var groups = await _context.Groups.ToListAsync();
        
        var groupDtos = groups.Select(g => new GroupDto
        {
            Id = g.Id,
            Name = g.Name,
            ColorHex = g.ColorHex // Передаем цвет на фронтенд
        }).ToList();

        return Ok(groupDtos);
    }

    // 2. Создать новую группу
    [HttpPost]
    public async Task<ActionResult<GroupDto>> CreateGroup(GroupDto dto)
    {
        var group = new Group
        {
            Name = dto.Name
        };

        // Если клиент передал конкретный цвет — устанавливаем его.
        // Если нет — сработает твое дефолтное значение "#3788d8" из класса Group.
        if (!string.IsNullOrWhiteSpace(dto.ColorHex))
        {
            group.ColorHex = dto.ColorHex;
        }

        _context.Groups.Add(group);
        await _context.SaveChangesAsync();

        // Возвращаем DTO с актуальными данными (включая сгенерированный ID и примененный цвет)
        dto.Id = group.Id;
        dto.ColorHex = group.ColorHex; 

        return Ok(dto);
    }

    // 3. Удалить группу
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGroup(int id)
    {
        var group = await _context.Groups.FindAsync(id);
        if (group == null) return NotFound();

        _context.Groups.Remove(group);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}